import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { formatDateDMY } from "../../utils/dateUtils";
import { getProfile, assignPlan, confirmPayment, getPlanHistory } from "../../logic/profiles.logic";
import { setProfilePicture as setProfilePictureApi } from "../../logic/profiles.logic";
import { getAttachments, uploadAttachments, deleteAttachments } from "../../logic/attachments.logic";
import FamilyList from "../../components/family/FamilyList";
import FamilyForm from "../../components/family/FamilyForm";
import AddressSection from "../../components/address/AddressSection";
import OccupationSection from "../../components/occupation/OccupationSection";
import { getAddresses } from "../../logic/address.logic";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getFamily, addFamily, updateFamily, deleteFamily } from "../../logic/family.logic";
import { loadFormEnums } from "../../logic/enumStore";
import EducationSection from "../../components/education/EducationSection";
import { getEducation } from "../../logic/education.logic";
import { getOccupation } from "../../logic/occupation.logic";
// import { getGothras } from "../../logic/gothras.logic";
import { useAuth } from "../../auth/AuthContext";

// ─── Photo slot config ────────────────────────────────────────────────────────
const PHOTO_SLOTS = [
  { key: "horoscope",        label: "Horoscope Photo",    required: false },
  { key: "traditional_wear", label: "Traditional Wear",   required: false },
  { key: "casual_wear",      label: "Casual Wear",        required: false },
  { key: "activity_hobby",   label: "Activity / Hobby",   required: false },
  { key: "family",           label: "Family Photo",       required: false },
];

// Badge labels shown on grid tiles
const SLOT_BADGE = {
  horoscope:        "Horoscope",
  traditional_wear: "Traditional Wear",
  casual_wear:      "Casual Wear",
  activity_hobby:   "Activity / Hobby",
  family:           "Family Photo",
};

// Slots that are allowed to "Set as Profile"
// null/undefined category = Profile Gallery upload → also allowed
const CAN_SET_PROFILE_SLOTS = new Set(["traditional_wear", "casual_wear", "activity_hobby"]);

const canSetAsProfile = (category) =>
  !category || CAN_SET_PROFILE_SLOTS.has(category);

const GRADIENT = "linear-gradient(110deg, var(--amber), var(--rose-light))";

// ─── Shared helpers ───────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: "10.5px", fontWeight: 700, letterSpacing: ".12em",
    textTransform: "uppercase", color: "var(--amber)",
    display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px"
  }}>
    {children}
    <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
  </div>
);

const Attr = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div style={{
      padding: "5px 12px", background: "var(--bg)",
      borderRadius: "var(--r-sm)", border: "1px solid var(--border)",
      fontSize: "12.5px", color: "var(--ink-2)",
      display: "flex", alignItems: "center", gap: "10px",
      position: "relative", overflow: "hidden",
      transition: "border-color 160ms ease, transform 160ms ease",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.transform = "translateX(4px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateX(0)"; }}
    >
      <span style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--amber)", minWidth: "90px", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ color: "var(--ink-2)" }}>{value}</span>
    </div>
  );
};

const formatSibling = (total, married, position) => {
  if (total === null || total === undefined || total === "") return null;
  const n = parseInt(total) || 0;
  const m = parseInt(married) || 0;
  if (n === 0) return `No ${position}`;
  const suffix = m > 0 ? (n === 1 ? " (Married)" : ` (${m} Married)`) : "";
  return `${n} ${position}${suffix}`;
};

const buildSiblingLines = (profile) => {
  const lines = [];
  const elder   = formatSibling(profile.broe, profile.broem, "Elder");
  const younger = formatSibling(profile.broy, profile.borym, "Younger");
  if (elder || younger) lines.push({ label: "Brothers", text: [elder, younger].filter(Boolean).join(" · ") });
  const elderSis   = formatSibling(profile.sise, profile.sisem, "Elder");
  const youngerSis = formatSibling(profile.sisy, profile.sisym, "Younger");
  if (elderSis || youngerSis) lines.push({ label: "Sisters", text: [elderSis, youngerSis].filter(Boolean).join(" · ") });
  return lines;
};

const formatTwin = (hastwin) => {
  if (hastwin === null || hastwin === undefined || hastwin === "") return null;
  const v = parseInt(hastwin);
  if (v === 1) return "Yes";
  if (v === 2) return "No";
  return null;
};


const formatHeight = (cm) => {
  if (!cm && cm !== 0) return null;
  const totalCm = parseFloat(cm);
  if (isNaN(totalCm)) return null;
  const totalInches = totalCm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet} ft ${inches} in (${Math.round(totalCm)} cm)`;
};
const SUBSCRIPTION_PLANS = [
  { name: "bronze",  label: "Bronze",  duration: "6 months"  },
  { name: "silver",  label: "Silver",  duration: "12 months" },
  { name: "gold",    label: "Gold",    duration: "24 months" },
  { name: "diamond", label: "Diamond", duration: "36 months" },
];

const subLabel = { bronze: "Bronze", silver: "Silver", gold: "Gold", diamond: "Diamond" };
const colorMap = { paid: "badge-teal", expiring: "badge-amber", expired: "badge-neutral", unpaid: "badge-neutral" };

// ─── Clean export-only layout ─────────────────────────────────────────────────
function ExportLayout({ profile, enums, family, getGothraName }) {
  if (!profile || !enums) return null;

  const Row = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", padding: "6px 0" }}>
        <span style={{ minWidth: "160px", flexShrink: 0, fontWeight: 700, color: "#92400e", textTransform: "uppercase", fontSize: "10px", letterSpacing: ".05em", paddingTop: "2px" }}>
          {label}
        </span>
        <span style={{ fontSize: "12px", color: "#374151" }}>{value}</span>
      </div>
    );
  };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#d97706", borderBottom: "2px solid #fde68a", paddingBottom: "5px", marginBottom: "10px" }}>
        {title}
      </div>
      {children}
    </div>
  );

  const maritalStatusName =
  enums?.maritalsts?.map?.[String(profile?.maritalsts)]?.toLowerCase();

  const showChildren =
  (maritalStatusName === "divorced" || maritalStatusName === "widow") &&
  profile?.childrencount != null &&
  profile?.childrencount !== "";

  const siblings = buildSiblingLines(profile);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#ffffff", color: "#111", padding: "40px 48px", width: "740px" }}>
      <div style={{ marginBottom: "28px", paddingBottom: "16px", borderBottom: "3px solid #f59e0b" }}>
        <div style={{ fontSize: "28px", fontWeight: 300, fontStyle: "italic", lineHeight: 1.2, marginBottom: "6px" }}>
          {profile.firstname} {profile.middlei} {profile.lastname}
        </div>
        <div style={{ fontSize: "12px", color: "#6b7280" }}>
         {profile.familynames ? ` · ${profile.familynames}` : ""} {profile.client_id ? ` · Client ID: ${profile.client_id}` : ""}
        </div>
      </div>

      <Section title="Profile Details">
        <Row label="Birthdate"      value={formatDateDMY(profile.birthdate)} />
        <Row label="Gender"         value={profile.gender === 1 ? "Male" : "Female"} />
        <Row label="Birthtime"      value={profile.birthtime} />
        <Row label="Birthplace"     value={profile.birthplace} />
        {/* <Row label="Family God"     value={profile.familygod} /> */}
        <Row label="Height"         value={formatHeight(profile.height)} />
        <Row label="Weight"         value={profile.weight} />
        <Row label="Phone"          value={profile.phonenumber} />
        <Row label="Email"          value={profile.email} />
        <Row label="Color"          value={enums?.color?.map?.[profile.color]} />
        {/* <Row label="Birth District" value={profile.birthdist} />
        <Row label="Birth State"    value={profile.birthstate} /> */}
        <Row label="Birth Star"     value={enums?.birthstar?.map?.[profile.birthstar]} />
        <Row label="Pada"           value={enums?.birthpada?.map?.[profile.starpada]} />
        <Row label="Birth Rashi"    value={enums?.birthrasi?.map?.[profile.birthrasi]} />
        <Row label="Swagothra"      value={getGothraName(profile?.swagothra)} />
        <Row label="Mama Gothra"    value={getGothraName(profile?.mamagothra)} />
        <Row label="Marital Status" value={enums?.maritalsts?.map?.[String(profile.maritalsts)]} />
        {showChildren && (
          <Row label="Children" value={profile.childrencount} />
        )}
      </Section>

      {/* <Section title="Education">
        <Row label="Education 1"     value={profile.education1} />
        <Row label="College / Univ." value={profile.almamater} />
        <Row label="Education 2"     value={profile.education2} />
        <Row label="College / Univ." value={profile.almamater2} />
        <Row label="Other"           value={profile.udeducation} />
      </Section> */}

      {(siblings.length > 0 || profile.hastwin || (family && family.length > 0)) && (
        <Section title="Family Details">
          {siblings.map(({ label, text }) => <Row key={label} label={label} value={text} />)}
          <Row label="Has Twin?" value={formatTwin(profile.hastwin)} />
          {family && family.map(m => (
            <Row key={m.id} label={m.relationLabel || "Member"} value={[m.firstname, m.lastname].filter(Boolean).join(" ")} />
          ))}
        </Section>
      )}

      <Section title="Asset and Income Details">
        <Row label="Asset Details"     value={profile.assetdets} />
        <Row label="Asset Value (In Crores)"     value={profile.networth} />
        <Row label="Total Income (In Lakhs)" value={profile.income} />
      </Section>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ProfileView() {
  const { id } = useParams();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const admin = isAdmin();

  const [profile, setProfile] = useState(null);
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
// const [gothras, setGothras] = useState([]);
    useEffect(() => {
    loadProfile();
    loadImages();
    
    // Fetch gothras on mount
    // getGothras().then(setGothras); 
  }, [id]);



  const [family, setFamily] = useState([]);
  const [editingFamily, setEditingFamily] = useState(null);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [enums, setEnums] = useState(null);
  const [familyAddresses, setFamilyAddresses] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);

  // Zoom state for modal
  const [zoomed, setZoomed]       = useState(false);
  const [dragPos, setDragPos]     = useState({ x: 0, y: 0 });
  const [dragging, setDragging]   = useState(false);
  const dragStart                 = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // Plan state
  const [latestPlan,   setLatestPlan]   = useState(null);
  const [planHistory,  setPlanHistory]  = useState([]);
  const [showHistory,  setShowHistory]  = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("silver");
  const [planSaving,   setPlanSaving]   = useState(false);

  const handleExport = async (type) => {
  const element = profileRef.current;

    //REMOVE ALL OVERLAYS BEFORE CAPTURE
    const overlays = document.querySelectorAll(".image-modal-overlay");
    overlays.forEach(el => el.style.display = "none");

    await new Promise((r) => setTimeout(r, 200));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      ignoreElements: (el) => {
        return el.classList?.contains("image-modal-overlay");
      }
    });

    // restore overlays
    overlays.forEach(el => el.style.display = "");

    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    if (type === "pdf") {
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight);
      pdf.save("profile.pdf");
    } else {
      const link = document.createElement("a");
      link.href = imgData;
      link.download = "profile.jpg";
      link.click();
    }
  };

  

  // Reset zoom whenever modal image changes
  useEffect(() => {
    setZoomed(false);
    setDragPos({ x: 0, y: 0 });
  }, [previewIndex]);

  const handleAddAddress = ({ relationtype, relationid }) => {
    setEditingAddress({ relationtype, relationid });
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return "";
    const today = new Date();
    const dob = new Date(birthdate);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  const profileRef = useRef(); //takes the entire web page 
  const detailsRef = useRef(); //takes (copies) only the rightside details

  const loadFamilyAddresses = async (familyRows) => {
    const map = {};
    for (const f of familyRows) map[f.id] = await getAddresses("family", f.id);
    setFamilyAddresses(map);
  };

  const refreshFamilyAddress = async (familyId) => {
    const updated = await getAddresses("family", familyId);
    setFamilyAddresses(prev => ({ ...prev, [familyId]: updated }));
  };

  // const getGothraName = (gid) => {
  //   if (!gid || !gothras.length) return "Not Selected";
  //   const found = gothras.find(g => g.id === Number(gid));
  //   return found ? found.gothraname : gid;
  // };

  // ── Zoom handlers ─────────────────────────────────────────────────────────
  const handleImageDoubleClick = () => {
    if (zoomed) {
      setZoomed(false);
      setDragPos({ x: 0, y: 0 });
    } else {
      setZoomed(true);
    }
  };

  const handleMouseDown = (e) => {
    if (!zoomed) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: dragPos.x, py: dragPos.y };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setDragPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  };

  const handleMouseUp = () => setDragging(false);

  // Touch support for mobile
  const handleTouchStart = (e) => {
    if (!zoomed) return;
    const t = e.touches[0];
    dragStart.current = { mx: t.clientX, my: t.clientY, px: dragPos.x, py: dragPos.y };
    setDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.mx;
    const dy = t.clientY - dragStart.current.my;
    setDragPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const runExport = async (mode) => {
    const el = exportRef.current;
    el.style.left       = "0px";
    el.style.top        = "0px";
    el.style.visibility = "visible";
    el.style.zIndex     = "9999";

    await new Promise(r => setTimeout(r, 60));

    const canvas = await html2canvas(el, {
      scale: 2, useCORS: true, backgroundColor: "#ffffff",
      scrollX: 0, scrollY: 0,
      windowWidth: el.scrollWidth, windowHeight: el.scrollHeight,
    });

    el.style.left       = "-9999px";
    el.style.visibility = "hidden";
    el.style.zIndex     = "-1";

    if (mode === "pdf") {
      const pdf    = new jsPDF("p", "mm", "a4");
      const pageW  = pdf.internal.pageSize.getWidth();
      const pageH  = pdf.internal.pageSize.getHeight();
      const ratio  = canvas.width / pageW;
      const sliceH = pageH * ratio;
      let srcY = 0;
      while (srcY < canvas.height) {
        const sc  = document.createElement("canvas");
        sc.width  = canvas.width;
        sc.height = Math.min(sliceH, canvas.height - srcY);
        sc.getContext("2d").drawImage(canvas, 0, srcY, canvas.width, sc.height, 0, 0, canvas.width, sc.height);
        if (srcY > 0) pdf.addPage();
        pdf.addImage(sc.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, pageW, sc.height / ratio);
        srcY += sliceH;
      }
      pdf.save(`${profile.firstname}_${profile.lastname}_profile.pdf`);
    } else {
      const link    = document.createElement("a");
      link.href     = canvas.toDataURL("image/jpeg", 1.0);
      link.download = `${profile.firstname}_${profile.lastname}_profile.jpg`;
      link.click();
    }
  };

  //copy button functionality --start
  const copyDetailsToClipboard = () => {
  const formattedText = formatProfileForCopy();

  navigator.clipboard.writeText(formattedText)
    .then(() => alert("Full profile copied!"))
    .catch(() => alert("Copy failed"));
};

const [educationData, setEducationData] = useState([]);
const [addressData, setAddressData] = useState([]);
const [occupationData, setOccupationData] = useState([]);

const formatProfileForCopy = () => {
  if (!profile) return "";

  const lines = [];   

  // 🔹 Basic Info
  lines.push(`👤 *${profile.firstname} ${profile.lastname} ${profile.middlei || ""}*`);
  lines.push(`Client ID: ${profile.client_id || "-"}`);
  lines.push("");

  // 🔹 Profile Details
  lines.push("*📌 Profile Details*");
  lines.push(`Birthdate: ${formatDateDMY(profile.birthdate)}`);
  lines.push(`Gender: ${profile.gender === 1 ? "Male" : "Female"}`);
  lines.push(`AGE: ${profile.age || "-"}`);
  lines.push(`Birth Time: ${profile.birthtime || "-"}`);
  lines.push(`Birth Place: ${profile.birthplace || "-"}`);
  // lines.push(`Family God: ${profile.familygod || "-"}`);
  lines.push(`Height: ${formatHeight(profile.height)}`);
  lines.push(`Weight: ${profile.weight || "-"}`);
  // lines.push(`Birth District: ${profile.birthdist || "-"}`);
  // lines.push(`Birth State: ${profile.birthstate || "-"}`);
  lines.push("");

  // 🔹 Horoscope
  lines.push("*🔮 Horoscope Details*");
  lines.push(`Star: ${enums?.birthstar?.map?.[profile.birthstar] || "-"}`);
  lines.push(`Rashi: ${enums?.birthrasi?.map?.[profile.birthrasi] || "-"}`);
  lines.push(`Pada: ${enums?.birthpada?.map?.[profile.starpada] || "-"}`);
  lines.push(`Swagothra: ${profile?.swagothranm?.gothraname} `);
  lines.push(`mamagothra: ${profile?.mamagothranm?.gothraname} `);
  lines.push("");

  // Asset and Income details
  lines.push("*Asset and Income*");
  lines.push(`Asset Details: ${profile.assetdets || "-"}`);
  lines.push(`Asset Networth: ${profile.networth || "-"}`);
  lines.push(`Annual Income: ${profile.income || "-"}`);
  lines.push("");

  // 🔹 Siblings
  const siblingLines = buildSiblingLines(profile);
  if (siblingLines.length > 0) {
    lines.push("*👨‍👩‍👧 Siblings*");
    siblingLines.forEach(s => {
      lines.push(`${s.label}: ${s.text}`);
    });
    lines.push("");
  }

  lines.push(`Has Twin: ${formatTwin(profile.hastwin) || "-"}`);
  lines.push("");

  // Education details
  if (educationData.length > 0) {
    lines.push("*🎓 Education*");
    educationData.forEach((edu, i) => {
      lines.push(`${i + 1}. Qualification: ${edu.degree || "-"}`);
      lines.push(`   College: ${edu.college || "-"}`);
      lines.push(`   Field of study: ${edu.fieldstudy || "-"}`);
      lines.push(`   Year: ${edu.year || "-"}`);
    });
    lines.push("");
  }

  if (occupationData.length > 0) {
    lines.push("*💼 Occupation*");
    occupationData.forEach((occ, i) => {
      lines.push(`${i + 1}. ${occ.occname || "-"} (${occ.occrole || "-"})`);
      if (occ.compname) lines.push(`   Company: ${occ.compname}`);
      if (occ.income)   lines.push(`   Income: ${occ.income}`);
      if (occ.occtype)   lines.push(`   Occupation Type: ${occ.occtype}`);
    });
    lines.push("");
  }

  if (addressData.length > 0) {
    lines.push("* Address *");
    addressData.forEach((addr, i) => {
      lines.push(`${i + 1}. ${addr.addone || "-"}`);
      lines.push(`   ${addr.addtwo || "-"}`);
      lines.push(`   City: ${addr.city || "-"}`);
      lines.push(`   District: ${addr.district || "-"}`);
      lines.push(`   State: ${addr.state || "-"}`);
      lines.push(`   Country: ${addr.country || "-"}`);
      lines.push(`   Pincode: ${addr.pincode || "-"}`);
    });
    lines.push("");
  }

  // 🔥 🔹 FAMILY MEMBERS + ADDRESSES
  if (family && family.length > 0) {
    lines.push("*🏠 Family Members*");

    family.forEach((member, index) => {
      lines.push(`\n${index + 1}. ${member.name || "-"} (${member.relationLabel || "-"})`);

      if (member.age) lines.push(`   Age: ${member.age}`);
      if (member.education) lines.push(`   Education: ${member.education}`);
      if (member.occupation) lines.push(`   Occupation: ${member.occupation}`);

      // 👉 Addresses of that family member
      const addresses = familyAddresses?.[member.id];

      if (addresses && addresses.length > 0) {
        addresses.forEach((addr, i) => {
          lines.push(`   📍 Address ${i + 1}:`);

          if (addr.addressline1) lines.push(`      ${addr.addressline1}`);
          if (addr.addressline2) lines.push(`      ${addr.addressline2}`);
          if (addr.city) lines.push(`      City: ${addr.city}`);
          if (addr.state) lines.push(`      State: ${addr.state}`);
          if (addr.pincode) lines.push(`      Pincode: ${addr.pincode}`);
        });
      } else {
        lines.push(`   📍 Address: Not Available`);
      }
    });

    lines.push("");
  }

  return lines.join("\n");
};
//copy button functionality -- end

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadProfile();
    loadImages();
    // getGothras().then(setGothras);
    if (admin) {
      getPlanHistory(id)
        .then(plans => {
          if (Array.isArray(plans) && plans.length > 0) {
            setLatestPlan(plans[0]);
            setPlanHistory(plans);
          }
        })
        .catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    if (!profile?.id || !enums) return;
    getFamily(profile.id).then(rows => {
      setFamily(rows && Array.isArray(rows) ? rows.map(r => ({ ...r, relationLabel: enums?.relationtype?.map?.[r.relationtype] })) : []);
      loadFamilyAddresses(rows);
    });
  }, [profile?.id, enums]);

  const maritalStatusName =
  enums?.maritalsts?.map?.[String(profile?.maritalsts)]?.toLowerCase();

  const showChildren =
  (maritalStatusName === "divorced" || maritalStatusName === "widow") &&
  profile?.childrencount != null &&
  profile?.childrencount !== "";


  useEffect(() => {
    const handler = (e) => {
      if (previewIndex === null) return;
      if (e.key === "Escape")     { setPreviewIndex(null); }
      if (e.key === "ArrowLeft")  setPreviewIndex(i => i > 0 ? i - 1 : i);
      if (e.key === "ArrowRight") setPreviewIndex(i => i < sortedImages.length - 1 ? i + 1 : i);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewIndex, images.length]);

  useEffect(() => { loadFormEnums("profile").then(setEnums); }, []);

  const loadProfile = async () => { const data = await getProfile(id); setProfile(data); 
    const rows = await getEducation(id);                        //education details
    setEducationData(Array.isArray(rows) ? rows : []);

    const addressrows = await getAddresses("profile", id);      //address details
    // Extract only the ones that exist (not null/empty)
      const addressList = ["current", "permanent", "work"]
        .map(type => addressrows?.[type] ? { ...addressrows[type], type } : null)
        .filter(Boolean);

      setAddressData(addressList);

      const occrows = await getOccupation("profile", id);
      setOccupationData(Array.isArray(occrows) ? occrows : []);
  };
  const loadImages  = async () => { const imgs = await getAttachments("profile", id); setImages(imgs); };

  const isProfilePicture = (attachmentId) => profile?.profilePictureId === attachmentId;

  const slotOrder = PHOTO_SLOTS.map(s => s.key);
  const sortedImages = [...images].sort((a, b) => {
    if (isProfilePicture(a.id)) return -1;
    if (isProfilePicture(b.id)) return 1;
    const ai = slotOrder.indexOf(a.category);
    const bi = slotOrder.indexOf(b.category);
    if (ai !== -1 && bi === -1) return -1;
    if (ai === -1 && bi !== -1) return 1;
    if (ai !== -1 && bi !== -1) return ai - bi;
    return 0;
  });

  // ── Upload ────────────────────────────────────────────────────────────────
  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    await uploadAttachments("profile", id, files);
    setFiles([]);
    await loadImages();
    setUploading(false);
  };

  const uploadSlotImage = async (file, photoType) => {
    if (!file) return;
    await uploadAttachments("profile", id, file, photoType);
    await loadImages();
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      await deleteAttachments(attachmentId);
      await loadImages();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleSetProfilePicture = async (attachmentId) => {
    if (!profile?.id) return;
    setProfile(prev => ({ ...prev, profilePictureId: attachmentId }));
    try {
      await setProfilePictureApi(profile.id, attachmentId);
    } catch {
      alert("Failed to set profile picture");
    }
  };

  const saveFamily = async (data) => {
    if (editingFamily) await updateFamily(editingFamily.id, data);
    else await addFamily(profile.id, data);
    setEditingFamily(null);
    setShowFamilyForm(false);
    const rows = await getFamily(profile.id);
    setFamily(rows.map(r => ({ ...r, relationLabel: enums?.relationtype?.map?.[r.relationtype] })));
    loadFamilyAddresses(rows);
  };

  const removeFamily = async (fid) => {
    await deleteFamily(fid);
    setFamily(family.filter(f => f.id !== fid));
  };

  const refreshPlanData = async () => {
    const plans = await getPlanHistory(id);
    if (Array.isArray(plans) && plans.length > 0) {
      setLatestPlan(plans[0]);
      setPlanHistory(plans);
    }
  };

  const handleAssignPlan = async () => {
    if (latestPlan) {
      const confirmed = window.confirm(
        `This profile already has a ${subLabel[latestPlan.subscription_name]} (${latestPlan.payment_status}) plan expiring on ${new Date(latestPlan.plan_expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}.\nAssign a new ${subLabel[selectedPlan]} plan anyway?`
      );
      if (!confirmed) return;
    }
    setPlanSaving(true);
    try {
      const res = await assignPlan(id, selectedPlan);
      if (res.success) await refreshPlanData();
      else alert("Failed to assign plan");
    } catch { alert("Failed to assign plan"); }
    finally { setPlanSaving(false); }
  };

  const handleConfirmPayment = async () => {
    if (!window.confirm("Confirm payment received?")) return;
    try {
      const res = await confirmPayment(id);
      if (res.success) await refreshPlanData();
      else alert("Failed to confirm payment");
    } catch { alert("Failed to confirm payment"); }
  };

  if (!profile || !enums) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div className="ps-spinner" />
    </div>
  );

  //   const getGothraName = (id) => {
  //   if (!id || !gothras.length) return "Not Selected";
  //   const found = gothras.find(g => g.id === Number(id));
  //   return found ? found.gothraname : id;
  // };


  // Here profile updation img
  return (
    <>

      <div ref={profileRef} style={{ padding: "36px 40px"}}>
        <div style={{ display: "grid", gridTemplateColumns: "42% 1fr", gap: "28px", alignItems: "start" }}>

          {/* ═══════════════ LEFT — IMAGE GRID ═══════════════ */}
          <div>
            <div className="image-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {sortedImages.map((img, index) => {
                const isPfp       = isProfilePicture(img.id);
                const slotBadge   = !isPfp && img.category ? SLOT_BADGE[img.category] : null;
                const highlighted = isPfp || !!slotBadge;
                const showSetProfile = !isPfp && canSetAsProfile(img.category);

                return (
                  <div
                    key={img.id}
                    className={`image-tile ${isPfp ? "profile-image" : ""}`}
                    style={{ aspectRatio: "4 / 5" }}
                    onClick={() => setPreviewIndex(index)}
                  >
                    <img src={`http://localhost:8080${img.file_url}`} alt="Profile" />

                    {/* Gradient top-bar for slot images */}
                    {slotBadge && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0,
                        height: "3px", background: GRADIENT, pointerEvents: "none",
                      }} />
                    )}

                    {/* Profile badge — original CSS class */}
                    {isPfp && <span className="profile-badge">Profile</span>}

                    {/* Slot badge */}
                    {slotBadge && (
                      <span style={{
                        position: "absolute", top: "8px", left: "8px",
                        background: GRADIENT, color: "#fff",
                        fontSize: "9.5px", fontWeight: 700, letterSpacing: ".06em",
                        textTransform: "uppercase", padding: "3px 9px",
                        borderRadius: "999px", boxShadow: "0 2px 6px rgba(0,0,0,.28)",
                        pointerEvents: "none",
                      }}>
                        {slotBadge}
                      </span>
                    )}

                    {/* Set as Profile — only for eligible categories */}
                    {showSetProfile && (
                      <button className="set-profile-btn" onClick={e => { e.stopPropagation(); handleSetProfilePicture(img.id); }}>
                        Set as Profile
                      </button>
                    )}

                    {/* Delete — white text */}
                    {!isPfp && (
                      <button
                        className="delete-image-btn"
                        style={{ color: "#fff" }}
                        onClick={e => { e.stopPropagation(); handleDeleteAttachment(img.id); }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Profile Gallery (drag & drop) ── */}
            <div
              className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={e => { e.preventDefault(); setIsDragging(false); setFiles(e.dataTransfer.files); }}
              style={{ marginTop: "14px" }}
            >
              <div style={{ marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-2)" }}>Profile Gallery</span>
                <span style={{ fontSize: "11px", color: "var(--ink-4)", marginLeft: "6px" }}>portraits, candid shots, etc.</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--ink-3)" }}>Drag & drop images here</p>
              <p style={{ fontSize: "12px", color: "var(--ink-4)", margin: "4px 0" }}>or</p>
              <input type="file" multiple accept="image/*" onChange={e => setFiles(e.target.files)} />
              <button
                onClick={upload}
                disabled={uploading || !files.length}
                style={{
                  marginTop: "10px", padding: "9px 24px", border: "none",
                  borderRadius: "var(--r-sm)",
                  background: uploading || !files.length ? "var(--border)" : "linear-gradient(110deg, var(--amber), var(--rose-light))",
                  color: uploading || !files.length ? "var(--ink-4)" : "#fff",
                  fontSize: "13px", fontWeight: 700,
                  cursor: uploading || !files.length ? "not-allowed" : "pointer",
                  transition: "all 160ms ease"
                }}
              >
                {uploading ? "Uploading..." : "Upload Images"}
              </button>

              <br />

              {/* ── Slot uploads ── */}
              <div className="upload-dropzone">
                <h3 className="section-title">------------Upload Photos--------------</h3>
                {PHOTO_SLOTS.map((slot) => (
                  <div key={slot.key} className="upload-slot">
                    <label className="upload-label">
                      {slot.label}
                      {slot.required && <span className="required">*</span>}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => uploadSlotImage(e.target.files[0], slot.key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* <Link to={`/profiles/${profile.id}/horoscope`} style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              marginTop: "12px", padding: "8px 18px",
              borderRadius: "var(--r-sm)", border: "1.5px solid var(--border)",
              background: "var(--surface)", color: "var(--ink-3)",
              fontSize: "12.5px", fontWeight: 600, textDecoration: "none",
              transition: "all 160ms ease"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.color = "var(--amber)"; e.currentTarget.style.background = "var(--amber-dim)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "var(--surface)"; }}
            >
              ☽ View Horoscope
            </Link> */}
          </div>

        {/* ═══════════════ RIGHT — DETAILS ═══════════════ */}
        <div ref={detailsRef} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Name + actions */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)", padding: "28px 32px",
            boxShadow: "var(--shadow-sm)", position: "relative", overflow: "hidden",
            animation: "slideRight .5s var(--smooth) .1s both"
          }}>
            <button
                onClick={copyDetailsToClipboard}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  cursor: "pointer"
                }}
              >
                📋 Copy
              </button>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, var(--amber), var(--rose-light))" }} />
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 400, fontStyle: "italic", color: "var(--ink)", lineHeight: 1.1, marginBottom: "2px" }}>
              <Link to={`/profiles/${profile.id}/edit`} style={{ textDecoration: "none", color: "inherit" }} target="_blank">
                {profile.firstname} {profile.lastname} {profile.middlei}
              </Link>
            </h1>
            <div style={{ fontSize: "13px", color: "var(--ink-3)", marginBottom: "4px" }}>
              {profile.familynames} {profile.client_id && `(Client ID #: ${profile.client_id})`}
            </div>
            <div style={{ height: "2px", background: "linear-gradient(90deg, var(--amber), var(--rose-light), transparent)", borderRadius: "9999px", marginBottom: "18px" }} />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { to: `/profiles/${profile.id}/edit`, label: "✎ Edit Profile", state: { fromProfile: location.pathname }},
                { to: `/profiles/${profile.id}/preferences`, label: "⚙ Preferences", state: { fromProfile: location.pathname }},
                { to: `/profiles/${profile.id}/match`, label: "⟳ Find Matches", state: { fromProfile: location.pathname }},
              ].map(link => (
                <Link key={link.to} to={link.to} state={link.state} style={{
                  padding: "7px 16px", borderRadius: "var(--r-sm)",
                  border: "1.5px solid var(--border)", background: "var(--bg)",
                  color: "var(--ink-3)", fontSize: "12.5px", fontWeight: 600,
                  textDecoration: "none", transition: "all 160ms ease",
                  display: "inline-flex", alignItems: "center", gap: "5px"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.color = "var(--amber)"; e.currentTarget.style.background = "var(--amber-dim)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "var(--bg)"; }}
                  target="_blank"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Profile Details */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)", padding: "24px 28px", boxShadow: "var(--shadow-sm)"
          }}>
            <SectionLabel>Profile Details</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" }}>
              <Attr label="Birthdate" value={formatDateDMY(profile.birthdate)} />
              <Attr label="Age" value={calculateAge(profile.birthdate)} />
              <Attr label="Gender" value={profile.gender === 1 ? "Male" : "Female"} />
              <Attr label="Birthtime" value={profile.birthtime} />
              <Attr label="Birthplace" value={profile.birthplace} />
              {/* <Attr label="Family God" value={profile.familygod} /> */}
              <Attr label="Height" value={formatHeight(profile.height)} />
              <Attr label="Weight" value={profile.weight} />
              <Attr label="Phone" value={profile.phonenumber} />
              <Attr label="Email" value={profile.email} />
              <Attr label="Color" value={enums?.color?.map?.[profile.color]} />
              {/* <Attr label="Birth District" value={profile.birthdist} />
              <Attr label="Birth State" value={profile.birthstate} /> */}
              <Attr label="Birth Star" value={enums?.birthstar?.map?.[profile.birthstar]} />
              <Attr label="Pada" value={enums?.birthpada?.map?.[profile.starpada]} />
              <Attr label="Birth Rashi" value={enums?.birthrasi?.map?.[profile.birthrasi]} />
              <Attr label="Marital Status" value={enums?.maritalsts?.map?.[String(profile.maritalsts)]} />
              {showChildren && (
                <Attr label="Children" value={profile.childrencount} />
              )}
              <Attr label="Swagothra" value={profile?.swagothranm?.gothraname} />
              <Attr label="Mamagothra" value={profile?.mamagothranm?.gothraname} />
            </div>

            {/* <SectionLabel>Education</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" }}>
              <Attr label="Education 1" value={profile.education1} />
              <Attr label="College / Univ." value={profile.almamater} />
              <Attr label="Education 2" value={profile.education2} />
              <Attr label="College / Univ." value={profile.almamater2} />
              <Attr label="Other" value={profile.udeducation} />
            </div> */}

            <div className="pf-card">
              <div className="pf-card-header">
                <h2 className="pf-card-title">Education</h2>
                <p className="pf-card-sub">Add and manage education details</p>
              </div>
  
              <EducationSection profile_id={id} />
            </div>

              {/* {console.log("familyid being passed:", family.find(m => m.relationtype === 1 || m.relationtype === 2)?.id)}
              //{console.log("family array:", family.map(m => ({ id: m.id, relationtype: m.relationtype, typeof: typeof m.relationtype })))} */}
              <AddressSection
                relationtype="profile"
                relationid={profile.id}
                familyids={family
                  .filter(m => Number(m.relationtype) === 1 || Number(m.relationtype) === 2)
                  .map(m => m.id)}
              />

              <div style={{
                marginTop: "12px",
                padding: "16px 20px",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                background: "var(--bg)"
              }}>
                <OccupationSection parenttype="profile" parentid={profile.id} />
              </div>

              <SectionLabel>Asset and Income Details</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" }}>
                <Attr label="Asset Details" value={profile.assetdets} />
                <Attr label="Asset Value" value={profile.networth} />
                <Attr label="Annual Income" value={profile.income} />
              </div>

          </div>
            {/* Family Details */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "24px 28px", boxShadow: "var(--shadow-sm)" }}>
              <SectionLabel>Family Details</SectionLabel>
              {(() => {
                const lines = buildSiblingLines(profile);
                return lines.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "4px" }}>
                    {lines.map(({ label, text }) => (
                      <div key={label} style={{
                        padding: "5px 12px", background: "var(--bg)",
                        borderRadius: "var(--r-sm)", border: "1px solid var(--border)",
                        fontSize: "12.5px", color: "var(--ink-2)",
                        display: "flex", alignItems: "center", gap: "10px",
                        transition: "border-color 160ms ease, transform 160ms ease",
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateX(0)"; }}
                      >
                        <span style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--amber)", minWidth: "90px", flexShrink: 0 }}>
                          {label}
                        </span>
                        {text}
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
                <Attr label="Has Twin?" value={formatTwin(profile.hastwin)} />
              </div>
              <FamilyList
                members={family}
                addresses={familyAddresses}
                onAdd={() => { setEditingFamily(null); setShowFamilyForm(true); }}
                onEdit={m => { setEditingFamily(m); setShowFamilyForm(true); }}
                onDelete={removeFamily}
                onRefreshAddress={refreshFamilyAddress}
              />
              {showFamilyForm && (
                <FamilyForm
                  value={editingFamily}
                  enums={enums}
                  onSave={saveFamily}
                  onCancel={() => { setEditingFamily(null); setShowFamilyForm(false); }}
                />
              )}
            </div>

            {/* Subscription Plan — admin only */}
            {admin && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "24px 28px", boxShadow: "var(--shadow-sm)" }}>
                <SectionLabel>Subscription Plan</SectionLabel>
                {latestPlan && (
                  <div style={{ marginBottom: "20px", padding: "14px 16px", background: "var(--bg)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>Current Plan</span>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                        <span className="badge badge-neutral">{subLabel[latestPlan.subscription_name] || latestPlan.subscription_name}</span>
                        <span className={`badge ${colorMap[latestPlan.payment_status] || "badge-neutral"}`}>
                          {latestPlan.payment_status?.charAt(0).toUpperCase() + latestPlan.payment_status?.slice(1)}
                        </span>
                      </div>
                    </div>
                    {latestPlan.plan_expiry && (
                      <div>
                        <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>Expires</span>
                        <div style={{ fontSize: "13px", fontWeight: 500, marginTop: "4px" }}>
                          {new Date(latestPlan.plan_expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </div>
                      </div>
                    )}
                    {latestPlan.payment_confirmed_at && (
                      <div>
                        <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>Paid On</span>
                        <div style={{ fontSize: "13px", fontWeight: 500, marginTop: "4px" }}>
                          {new Date(latestPlan.payment_confirmed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </div>
                      </div>
                    )}
                    {latestPlan.payment_status === "unpaid" && (
                      <button type="button" className="ps-action-btn"
                        style={{ background: "var(--teal)", color: "#fff", border: "none", marginLeft: "auto" }}
                        onClick={handleConfirmPayment}>
                        ✓ Confirm Payment
                      </button>
                    )}
                  </div>
                )}
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--ink-3)", display: "block", marginBottom: "6px" }}>Assign New Plan</label>
                    <select className="pf-input pf-select" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
                      {SUBSCRIPTION_PLANS.map(p => (
                        <option key={p.name} value={p.name}>{p.label} — {p.duration}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="ps-search-btn" onClick={handleAssignPlan} disabled={planSaving}>
                    {planSaving ? "Assigning..." : "Assign Plan"}
                  </button>
                </div>
                {planHistory.length > 0 && (
                  <div>
                    <button type="button" className="btn-secondary" onClick={() => setShowHistory(h => !h)}>
                      {showHistory ? "Hide History" : `View History (${planHistory.length})`}
                    </button>
                    {showHistory && (
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {planHistory.map((plan, i) => (
                          <div key={plan.id} style={{ padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", background: i === 0 ? "var(--bg)" : "transparent" }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                              <span className={`badge ${colorMap[plan.payment_status] || "badge-neutral"}`}>
                                {plan.payment_status?.charAt(0).toUpperCase() + plan.payment_status?.slice(1)}
                              </span>
                              <span style={{ fontSize: "13px", fontWeight: 500 }}>{subLabel[plan.subscription_name] || plan.subscription_name}</span>
                              {i === 0 && <span style={{ fontSize: "11px", color: "var(--ink-3)", marginLeft: "auto" }}>Latest</span>}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--ink-2)", display: "flex", gap: "12px" }}>
                              <span>Start: {new Date(plan.plan_start).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                              <span>Expiry: {new Date(plan.plan_expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                            </div>
                            {(plan.payment_status === "paid" || plan.payment_status === "expiring") && plan.payment_confirmed_at && (
                              <div style={{ fontSize: "12px", color: "var(--ink-3)", marginTop: "4px" }}>
                                Paid on: {new Date(plan.payment_confirmed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleExport("pdf")}
                className="btn-secondary"
              >
                Export PDF
              </button>

              <button
                onClick={() => handleExport("jpeg")}
                className="btn-secondary"
              >
                Export JPEG
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════ IMAGE PREVIEW MODAL ═══════════════ */}
        {previewIndex !== null && (
          <div
            className="image-modal-overlay"
            style={{ zIndex: 2100, position: "fixed", inset: 0 }}
            onClick={() => { if (!zoomed) setPreviewIndex(null); }}
          >
            <div
              className="image-modal-content"
              onClick={e => e.stopPropagation()}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setDragging(false)}
            >
              <button className="modal-close" onClick={() => setPreviewIndex(null)}>✕</button>

              {/* Slot badge in modal */}
              {(() => {
                const img   = sortedImages[previewIndex];
                const label = isProfilePicture(img?.id)
                  ? "Profile"
                  : (img?.category ? SLOT_BADGE[img.category] : null);
                return label ? (
                  <div style={{
                    position: "absolute", top: "14px", left: "14px",
                    background: GRADIENT, color: "#fff",
                    fontSize: "10px", fontWeight: 700, letterSpacing: ".07em",
                    textTransform: "uppercase", padding: "4px 10px",
                    borderRadius: "999px", zIndex: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,.3)",
                  }}>
                    {label}
                  </div>
                ) : null;
              })()}

              {/* Zoom hint */}
              <div style={{
                position: "absolute", top: "14px", right: "48px",
                fontSize: "10px", color: "rgba(255,255,255,.5)",
                fontWeight: 500, letterSpacing: ".04em", zIndex: 2,
                userSelect: "none",
              }}>
                {zoomed ? "Double-click to zoom out" : "Double-click to zoom in"}
              </div>

              {/* Zoomable image wrapper */}
              <div
                className="image-modal-zoom-wrap"
                style={{ overflow: "hidden", cursor: zoomed ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
              >
                <img
                  src={`http://localhost:8080${sortedImages[previewIndex]?.file_url}`}
                  alt="Preview"
                  draggable={false}
                  onDoubleClick={handleImageDoubleClick}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  style={{
                    transform: zoomed
                      ? `scale(2.5) translate(${dragPos.x / 2.5}px, ${dragPos.y / 2.5}px)`
                      : "scale(1) translate(0,0)",
                    transition: dragging ? "none" : "transform 260ms ease",
                    userSelect: "none",
                    WebkitUserDrag: "none",
                  }}
                />
              </div>

              {/* Prev / Next */}
              <div style={{ position: "absolute", bottom: "-52px", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "12px" }}>
                <button onClick={() => setPreviewIndex(i => i > 0 ? i - 1 : i)} className="modal-zoom-btn" disabled={previewIndex === 0} style={{ opacity: previewIndex === 0 ? 0.4 : 1 }}>←</button>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", minWidth: "60px", textAlign: "center" }}>
                  {previewIndex + 1} / {sortedImages.length}
                </span>
                <button onClick={() => setPreviewIndex(i => i < sortedImages.length - 1 ? i + 1 : i)} className="modal-zoom-btn" disabled={previewIndex === sortedImages.length - 1} style={{ opacity: previewIndex === sortedImages.length - 1 ? 0.4 : 1 }}>→</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}