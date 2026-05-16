import { useEffect, useState, useRef, useCallback } from "react";
import { getGothras } from "../../logic/gothras.logic";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { searchProfiles, changests, searchProfilesAdmin, assignPlan, confirmPayment, getPlanHistory } from "../../logic/profiles.logic";
import { loadFormEnums } from "../../logic/enumStore";
import { useAuth } from "../../auth/AuthContext";
import { HeightPicker } from "./ProfileForm";
import { getEducation } from "../../logic/education.logic";

// ─── Height helpers ───────────────────────────────────────────────────────────
const feetInchesToCm = (feet, inches) => {
  const f = parseInt(feet)   || 0;
  const i = parseInt(inches) || 0;
  if (feet === "" && inches === "") return "";
  return ((f * 12 + i) * 2.54).toFixed(2);
};

const cmToFeetInches = (cm) => {
  if (!cm && cm !== 0) return { feet: "", inches: "" };
  const total  = parseFloat(cm) / 2.54;
  const feet   = Math.floor(total / 12);
  const inches = Math.round(total % 12);
  if (inches === 12) return { feet: feet + 1, inches: 0 };
  return { feet, inches };
};

const formatHeight = (cm) => {
  if (!cm) return "—";
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}'${inches}"`;
};

const calcAge = (birthdate) => {
  if (!birthdate) return null;
  return Math.floor((new Date() - new Date(birthdate)) / (365.25 * 24 * 60 * 60 * 1000));
};
// ─────────────────────────────────────────────────────────────────────────────

const daysUntilExpiry = (d) =>
  d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

const PaymentBadge = ({ status, expiryDate }) => {
  const days = daysUntilExpiry(expiryDate);
  const showAlert = days !== null && days <= 15 && days >= 0;
  const colorMap = { paid: "badge-teal", expiring: "badge-amber", expired: "badge-neutral", unpaid: "badge-neutral" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span className={`badge ${colorMap[status] || "badge-neutral"}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "No Plan"}
      </span>
      {showAlert && (
        <span title={`Expires in ${days} day(s)`} style={{ color: "#d97706", fontSize: "12px" }}>⚠️ {days}d</span>
      )}
    </div>
  );
};

// ─── Plan History Modal ───────────────────────────────────────────────────────
function PlanHistoryModal({ profile, onClose }) {
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const subLabel = { bronze: "Bronze", silver: "Silver", gold: "Gold", diamond: "Diamond" };
  const colorMap = { paid: "badge-teal", expiring: "badge-amber", expired: "badge-neutral", unpaid: "badge-neutral" };

  useEffect(() => {
    getPlanHistory(profile.id)
      .then(data => { setPlans(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [profile.id]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "28px", width: "500px", maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Plan History</h3>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--ink-3)" }}>{profile.firstname} {profile.lastname}</p>
          </div>
          <button className="btn-secondary" onClick={onClose}>✕</button>
        </div>
        {loading
          ? <div style={{ textAlign: "center", padding: "32px" }}><div className="ps-spinner" /></div>
          : plans.length === 0
            ? <p style={{ color: "var(--ink-3)", textAlign: "center", padding: "32px 0" }}>No plans found</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {plans.map((plan, i) => (
                  <div key={plan.id} style={{ padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", background: i === 0 ? "var(--bg)" : "transparent" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span className={`badge ${colorMap[plan.payment_status] || "badge-neutral"}`}>
                          {plan.payment_status?.charAt(0).toUpperCase() + plan.payment_status?.slice(1)}
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 500 }}>{subLabel[plan.subscription_name] || plan.subscription_name}</span>
                      </div>
                      {i === 0 && <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>Latest</span>}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--ink-2)", display: "flex", gap: "16px" }}>
                      <span>Start: <strong>{new Date(plan.plan_start).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}</strong></span>
                      <span>Expiry: <strong>{new Date(plan.plan_expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}</strong></span>
                    </div>
                    {(plan.payment_status === "paid" || plan.payment_status === "expiring") && plan.payment_confirmed_at && (
                      <div style={{ fontSize: "12px", color: "var(--ink-3)", marginTop: "4px" }}>
                        Paid on: {new Date(plan.payment_confirmed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
        }
      </div>
    </div>
  );
}

// ─── Photo Modal with double-tap / double-click zoom ─────────────────────────
function PhotoModal({ profiles, index, onClose, onNavigate, gothras, enums, educationMap }) {
  const [zoomed, setZoomed]   = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const lastTap               = useRef(0);
  const imgRef                = useRef(null);
  const p                     = profiles[index];

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape")                                       { onClose(); }
      if (e.key === "ArrowLeft"  && index > 0)                     { onNavigate(index - 1); }
      if (e.key === "ArrowRight" && index < profiles.length - 1)   { onNavigate(index + 1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, onClose, onNavigate, profiles.length]);

  useEffect(() => { setZoomed(false); }, [index]);

  const triggerZoom = useCallback((clientX, clientY) => {
    if (!zoomed && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      setZoomPos({
        x: ((clientX - rect.left) / rect.width)  * 100,
        y: ((clientY - rect.top)  / rect.height) * 100,
      });
    }
    setZoomed(z => !z);
  }, [zoomed]);

  const handleDoubleClick = (e) => { e.stopPropagation(); triggerZoom(e.clientX, e.clientY); };

  const handleTouchEnd = useCallback((e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      e.preventDefault();
      const t = e.changedTouches[0];
      triggerZoom(t.clientX, t.clientY);
    }
    lastTap.current = now;
  }, [triggerZoom]);

  if (!p) return null;

  const age        = calcAge(p.birthdate);
  const gothraName = gothras.find(g => String(g.id) === String(p.swagothra))?.gothraname
                     || p.swagothranm?.gothraname
                     || null;

  const birthstarName = enums?.birthstar?.options?.find(
                          o => String(o.enumvalue) === String(p.birthstar)
                        )?.strvalue || null;

  return (
    <div
      onClick={() => { if (zoomed) setZoomed(false); else onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.92)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: "absolute", top: "16px", right: "16px",
          background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
          width: "36px", height: "36px", fontSize: "18px", color: "#fff",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
        }}
      >✕</button>

      {/* Lines */}
      <Link
        to={`/profiles/${p.id}`}
        onClick={e => e.stopPropagation()}
        style={{ textDecoration: "none", textAlign: "center", marginBottom: "14px" }}
      >
        <p style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>
          {p.firstname} {p.lastname}
          <span style={{ fontSize: "13px", fontWeight: 400, opacity: 0.6, marginLeft: "8px" }}>#{p.client_id}</span>
        </p>
        <p style={{ margin: "0 0 3px", fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
          {p.birthdate
            ? `${new Date(p.birthdate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}${age ? ` (${age} yrs)` : ""}`
            : ""}
          {p.height ? ` · ${formatHeight(p.height)}` : ""}
        </p>
        <p style={{ margin: "0 0 3px", fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
          {(educationMap?.[p.id]?.length > 0)
            ? educationMap[p.id].map(e => e.degree).filter(Boolean).join(" · ")
            : "—"}
        </p>
        {gothraName && (
          <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.42)" }}>{gothraName}</p>
        )}
        {birthstarName && (
          <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.42)" }}>
            {birthstarName}
          </p>
        )}
      </Link>

      {/* Image */}
      <div
        onClick={e => e.stopPropagation()}
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative", overflow: "hidden",
          borderRadius: "var(--r-lg)",
          cursor: zoomed ? "zoom-out" : "zoom-in",
          maxWidth: "min(88vw, 500px)", maxHeight: "60vh",
        }}
      >
        <img
          ref={imgRef}
          src={p.profilePicture?.file_url ? `http://localhost:8080${p.profilePicture.file_url}` : "/assets/defaultProfile.png"}
          alt={p.firstname}
          style={{
            display: "block",
            maxWidth: "min(88vw, 500px)", maxHeight: "60vh",
            objectFit: "contain",
            borderRadius: "var(--r-lg)",
            transition: "transform 0.28s ease",
            transform: zoomed ? "scale(2.4)" : "scale(1)",
            transformOrigin: zoomed ? `${zoomPos.x}% ${zoomPos.y}%` : "center center",
            userSelect: "none",
          }}
          draggable={false}
        />
        {zoomed && (
          <div style={{
            position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "11px",
            padding: "3px 10px", borderRadius: "99px", pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            Double-tap to zoom out
          </div>
        )}
      </div>

      {!zoomed && (
        <p style={{ marginTop: "10px", fontSize: "11px", color: "rgba(255,255,255,0.28)", textAlign: "center" }}>
          Double-tap to zoom · ← → to navigate · ESC to close
        </p>
      )}

      <div
        style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "14px" }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => { onNavigate(index - 1); setZoomed(false); }}
          disabled={index === 0}
          style={{
            background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
            width: "38px", height: "38px", fontSize: "18px", color: "#fff",
            cursor: "pointer", opacity: index === 0 ? 0.3 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >←</button>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)", minWidth: "60px", textAlign: "center" }}>
          {index + 1} / {profiles.length}
        </span>
        <button
          onClick={() => { onNavigate(index + 1); setZoomed(false); }}
          disabled={index === profiles.length - 1}
          style={{
            background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
            width: "38px", height: "38px", fontSize: "18px", color: "#fff",
            cursor: "pointer", opacity: index === profiles.length - 1 ? 0.3 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >→</button>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilesSearch() {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const admin       = isAdmin();

  const [filters, setFilters] = useState({
    id: "", name: "", birthdateFrom: "", birthdateTo: "", gender: "",client_id : "",
    birthstar: [], status: 1,
    city: "", state: "", district: "",
    minHeight: "", maxHeight: "", phonenumber: "",
    color: "", sortBy: "firstname", sortDir: "asc",
    occtype: [], otherProfession: "", swagothra: "", income: "", networth: "", birthyear: [],
  });

  const [profiles,       setProfiles]       = useState([]);
  const [educationMap, setEducationMap] = useState({});
  const [enums,          setEnums]          = useState(null);
  const [gothras,        setGothras]        = useState([]);
  const [open,           setOpen]           = useState(false);
  const [openOcc,        setOpenOcc]        = useState(false);
  const [openYear, setOpenYear]             = useState(false);
  const [historyProfile, setHistoryProfile] = useState(null);
  const [page,           setPage]           = useState(1);
  const [total,          setTotal]          = useState(0);
  const [pages,          setPages]          = useState(1);
  const [openAction,     setOpenAction]     = useState(null);
  const [popoverPos,     setPopoverPos]     = useState({ top: 0, left: 0 });
  const [subFilter,      setSubFilter]      = useState("");
  const [payFilter,      setPayFilter]      = useState("");
  const [viewMode,       setViewMode]       = useState("tile");
  const [previewIndex,   setPreviewIndex]   = useState(null);

  const load = async (pg = 1) => {
    try {
      const adminFilters = admin
        ? { ...filters, ...(subFilter && { subscriptionName: subFilter }), ...(payFilter && { paymentStatus: payFilter }) }
        : filters;
      const data = admin
        ? await searchProfilesAdmin(adminFilters, pg)
        : await searchProfiles(filters, false, pg);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setProfiles(list);
      setTotal(data?.total ?? list.length);
      setPages(data?.pages ?? 1);
      setPage(pg);

      // ── Fetch education for all profiles in parallel ──
      const eduEntries = await Promise.all(
        list.map(async (p) => {
          const rows = await getEducation(p.id);
          return [p.id, Array.isArray(rows) ? rows : []];
        })
      );
      setEducationMap(Object.fromEntries(eduEntries));

    } catch (err) {
      console.error("Error loading profiles:", err);
      setProfiles([]);
    }
  };

  // useEffect(() => {
  //   if (location.state?.refresh) {
  //     load(page);
  //   }
  // }, [location.state]);

  useEffect(() => {
    getGothras().then(setGothras);
    loadFormEnums("profile").then(async (e) => { setEnums(e); load(1); });
  }, [location]);

  useEffect(() => {
    const handler = () => setOpen(false);
    if (open) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  useEffect(() => {
    const handler = () => setOpenAction(null);
    if (openAction) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openAction]);


  useEffect(() => {
  const handleClick = () => setOpenYear(false);
  window.addEventListener("click", handleClick);
  return () => window.removeEventListener("click", handleClick);
}, []);
  // const [birthYears, setBirthYears] = useState([]);
  const currentYear = new Date().getFullYear();

  const birthYears = Array.from(
    { length: currentYear - 1970 + 1 },
    (_, i) => currentYear - i
  );



  const onChange        = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleSubFilter = (e) => { setSubFilter(e.target.value); setPage(1); };
  const handlePayFilter = (e) => { setPayFilter(e.target.value); setPage(1); };

  const toggleBirthStar = (value) => {
    setFilters(prev => ({
      ...prev,
      birthstar: prev.birthstar.includes(value)
        ? prev.birthstar.filter(v => v !== value)
        : [...prev.birthstar, value],
    }));
  };

  const toggleOccType = (value) => {
    setFilters(prev => ({
      ...prev,
      occtype: prev.occtype.includes(value)
        ? prev.occtype.filter(v => v !== value)
        : [...prev.occtype, value],
    }));
  };


  const toggleBirthYear = (year) => {
    setFilters(prev => ({
      ...prev,
      birthyear: prev.birthyear.includes(year)
        ? prev.birthyear.filter(y => y !== year)
        : [...prev.birthyear, year]
    }));
  };

  const handleConfirmPayment = async (profileId) => {
    if (!window.confirm("Confirm payment received?")) return;
    try {
      const res = await confirmPayment(profileId);
      if (res.success) {
        setProfiles(prev => prev.map(p =>
          p.id === profileId
            ? { ...p, latestPlan: { ...(p.latestPlan || {}), payment_status: res.payment_status, payment_confirmed_at: res.payment_confirmed_at } }
            : p
        ));
      } else alert("Failed to confirm payment");
    } catch { alert("Failed to confirm payment"); }
  };

  if (!enums) return null;

  const isProfessionalSelected = filters.occtype.some(id =>
    enums.occtype.options.find(o => o.enumvalue === id)?.strvalue === "Professional"
  );

  const subLabel = { bronze: "Bronze", silver: "Silver", gold: "Gold", diamond: "Diamond" };

  // ─── Tile card ────────────────────────────────────────────────────────────
  const renderTileCard = (p, i) => {
    const age        = calcAge(p.birthdate);
    const gothraName = gothras.find(g => String(g.id) === String(p.swagothra))?.gothraname
                       || p.swagothranm?.gothraname
                       || null;
    const plan       = p.latestPlan;

    return (
      <div
        key={p.id}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Photo hero */}
        <div
          style={{
            position: "relative", width: "100%", aspectRatio: "3/4",
            background: "var(--bg)", overflow: "hidden", cursor: "pointer",
          }}
          onClick={() => setPreviewIndex(i)}
        >
          <img
            src={p.profilePicture?.file_url ? `http://localhost:8080${p.profilePicture.file_url}` : "/assets/defaultProfile.png"}
            alt={p.firstname}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
          {/* Status dot */}
          <span style={{
            position: "absolute", top: "10px", right: "10px",
            width: "10px", height: "10px", borderRadius: "50%",
            border: "2px solid #fff",
            background: (p.profilests === 1 || p.profilests === "1") ? "#0dd532" : "#f90505",
          }} />
          {/* 3-line overlay */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "28px 12px 12px",
            background: "linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 100%)",
          }}>
            {/* Line 1: Name (#ID) */}
            <p style={{ margin: "0 0 3px", fontSize: "14px", fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>
              {p.firstname} {p.lastname}
              <span style={{ fontSize: "18px", fontWeight: 500, opacity: 0.7, marginLeft: "6px" }}>#{p.client_id}</span>
            </p>
            {/* Line 2: Birthdate (age) · Height */}
            <p style={{ margin: "0 0 2px", fontSize: "11px", color: "rgba(255,255,255,0.82)", lineHeight: 1.3 }}>
              {p.birthdate
                ? `${new Date(p.birthdate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}${age ? ` (${age} yrs)` : ""}`
                : "—"}
              {p.height ? ` · ${formatHeight(p.height)}` : ""}
            </p>
            {/* Line 3: Gothram */}
            <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>
              {gothraName || "—"}
            </p>
             {/* Line 4: Education from education table */}
            <p style={{ margin: "0 0 2px", fontSize: "11px", color: "rgba(255,255,255,0.82)", lineHeight: 1.3 }}>
              {(educationMap[p.id]?.length > 0)
                ? educationMap[p.id].map(e => e.degree).filter(Boolean).join(" · ")
                : "—"}
            </p>
          </div>
        </div>

        {/* Below-photo details */}
        <div style={{ padding: "10px 12px 8px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>

          {/* Badges */}
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {admin && (
              <span className={`badge ${p.profilests === 1 ? "badge-teal" : "badge-neutral"}`}>
                {p.profilests === 1 ? "Active" : "Inactive"}
              </span>
            )}
            {plan?.subscription_name && (
              <span className="badge badge-neutral">{subLabel[plan.subscription_name] || plan.subscription_name}</span>
            )}
            {plan && (
              <PaymentBadge status={plan.payment_status || "unpaid"} expiryDate={plan.plan_expiry} />
            )}
          </div>

          {/* Detail grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 12px" }}>
            {[
              ["Income",   p.income   || "—"],
              ["Networth", p.networth || "—"],
              ...(admin ? [
                ["Registered",  p.createdon        ? new Date(p.createdon).toLocaleDateString("en-IN",          { day: "2-digit", month: "2-digit", year: "numeric" }) : "N/A"],
                ["Plan Expiry", plan?.plan_expiry   ? new Date(plan.plan_expiry).toLocaleDateString("en-IN",    { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"],
                ["Last Active", p.last_interaction  ? new Date(p.last_interaction).toLocaleDateString("en-IN",  { day: "2-digit", month: "2-digit", year: "numeric" }) : "Never"],
              ] : []),
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ margin: "0 0 1px", fontSize: "9px", color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--ink)" }}>{value}</p>
              </div>
            ))}
            {/* Matches */}
            <div>
              <p style={{ margin: "0 0 1px", fontSize: "9px", color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Matches</p>
              <button className="ps-match-pill"
                onClick={() => navigate(`/profiles/${p.id}/match`, { state: { fromProfile: location.pathname } })}>
                {p.matchcount || 0}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "5px", marginTop: "4px", paddingTop: "8px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
            <Link to={`/profiles/${p.id}`} className="ps-action-btn" target="_blank" style={{ fontSize: "11px", padding: "4px 10px" }}>View</Link>
            <Link to={`/profiles/${p.id}/edit`} className="ps-action-btn" target="_blank" style={{ fontSize: "11px", padding: "4px 10px" }}>Edit</Link>
            {p.profilests === 1 ? (
              <button className="ps-action-btn" style={{ fontSize: "11px", padding: "4px 10px" }}
                onClick={async () => {
                  const reason = window.prompt("Enter reason for inactivating this profile:");
                  if (reason !== null) {
                    await changests(p.id, 2, reason);
                    load(page);
                  }
                }}>
                Inactivate
              </button>
            ) : (
              <button className="ps-action-btn" style={{ fontSize: "11px", padding: "4px 10px" }}
                onClick={async () => { if (window.confirm("Activate this profile?")) { await changests(p.id, 1); load(page); } }}>
                Activate
              </button>
            )}
            {admin && (
              <button className="ps-action-btn" style={{ fontSize: "11px", padding: "4px 10px" }}
                onClick={() => setHistoryProfile(p)}>
                Plans
              </button>
            )}
            {admin && plan?.payment_status === "unpaid" && (
              <button className="ps-action-btn" style={{ fontSize: "11px", padding: "4px 10px", background: "var(--teal, #2ecc71)", color: "#fff", border: "none" }}
                onClick={() => handleConfirmPayment(p.id)}>
                Confirm Pay
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="ps-page">

      {historyProfile && (
        <PlanHistoryModal profile={historyProfile} onClose={() => setHistoryProfile(null)} />
      )}

      {previewIndex !== null && (
        <PhotoModal
          profiles={profiles}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={(idx) => { if (idx >= 0 && idx < profiles.length) setPreviewIndex(idx); }}
          gothras={gothras}
          enums={enums}
          educationMap={educationMap}
        />
      )}

      {/* Actions Popover — list view */}
      {openAction !== null && (() => {
        const p = profiles.find(x => x.id === openAction);
        if (!p) return null;
        const plan = p.latestPlan;
        return (
          <div onClick={e => e.stopPropagation()}
            style={{ position: "absolute", top: popoverPos.top, left: popoverPos.left, zIndex: 1000, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", padding: "6px", display: "flex", flexDirection: "column", gap: "4px", minWidth: "150px" }}
          >
            <Link to={`/profiles/${p.id}`} className="ps-action-btn" style={{ display: "block", textAlign: "left" }} onClick={() => setOpenAction(null)}>View</Link>
            <Link to={`/profiles/${p.id}/edit`} className="ps-action-btn" style={{ display: "block", textAlign: "left" }} onClick={() => setOpenAction(null)}>Edit</Link>
            {p.profilests === 1 ? (
              <button className="ps-action-btn" style={{ textAlign: "left", width: "100%" }}
                onClick={async () => { if (window.confirm("Inactivate this profile?")) { await changests(p.id, 2); setOpenAction(null); load(page); } }}>
                Inactivate
              </button>
            ) : (
              <button className="ps-action-btn" style={{ textAlign: "left", width: "100%" }}
                onClick={async () => { if (window.confirm("Activate this profile?")) { await changests(p.id, 1); setOpenAction(null); load(page); } }}>
                Activate
              </button>
            )}
            {admin && <>
              <button className="ps-action-btn" style={{ textAlign: "left", width: "100%" }} onClick={() => { setHistoryProfile(p); setOpenAction(null); }}>Plans History</button>
              {(plan && plan.payment_status === "unpaid") && (
                <button className="ps-action-btn" style={{ textAlign: "left", width: "100%", background: "var(--teal, #2ecc71)", color: "#fff", border: "none" }}
                  onClick={() => { handleConfirmPayment(p.id); setOpenAction(null); }}>
                  Confirm Payment
                </button>
              )}
            </>}
          </div>
        );
      })()}

      {/* ── Header ── */}
      <div className="ps-header">
        <div>
          <p className="ps-header-eyebrow">Directory</p>
          <h1 className="ps-header-title">Profiles</h1>
          <div className="ps-header-bar" />
        </div>
        <Link to="/profiles/new" className="ps-add-btn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Profile
        </Link>
      </div>

      {/* ── Filters ── */}
      <div className="ps-filter-card">
        <div className="ps-filter-title">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 2h12l-4.5 5.5V12L5.5 13V7.5L1 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          Search Filters
        </div>
        <div className="ps-filter-grid">

          <div className="ps-field">
            <label className="ps-label">ClientID</label>
            <input className="ps-input" name="client_id" placeholder="e.g. 19123" value={filters.client_id} onChange={onChange} />
          </div>

          <div className="ps-field">
            <label className="ps-label">Phone Number</label>
            <input className="ps-input" name="phonenumber" placeholder="e.g. 9876543210" value={filters.phonenumber} onChange={onChange} />
          </div>

          <div className="ps-field">
            <label className="ps-label">Birth Year</label>

            <div style={{ position: "relative" }}>
              
              {/* SELECT BUTTON */}
              <button
                type="button"
                className="ps-input ps-select"
                onClick={(e) => { e.stopPropagation(); setOpenYear(!openYear); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span style={{ color: filters.birthyear.length > 0 ? "var(--ink)" : "var(--ink-4)" }}>
                  {filters.birthyear.length > 0
                    ? `${filters.birthyear.length} year${filters.birthyear.length > 1 ? "s" : ""} selected`
                    : "Select Birth Years"}
                </span>

                {filters.birthyear.length > 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters(prev => ({ ...prev, birthyear: [] }));
                    }}
                    style={{
                      fontSize: "11px",
                      color: "var(--ink-3)",
                      marginLeft: "6px",
                      cursor: "pointer"
                    }}
                  >
                    ✕
                  </span>
                )}
              </button>

              {/* SELECTED VALUES TEXT (like birthstar) */}
              {filters.birthyear.length > 0 && (
                <div style={{
                  marginTop: "4px",
                  fontSize: "11px",
                  color: "var(--ink-3)",
                  lineHeight: 1.6
                }}>
                  {filters.birthyear.join(" · ")}
                </div>
              )}

              {/* DROPDOWN */}
              {openYear && (
                <div style={{
                  position: "absolute",
                  zIndex: 10,
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-sm)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  maxHeight: "200px",
                  overflowY: "auto",
                  marginTop: "4px"
                }}>
                  {birthYears.map(year => (
                    <label
                      key={year}
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <input
                        type="checkbox"
                        style={{
                          width: "13px",
                          height: "13px",
                          accentColor: "var(--amber)"
                        }}
                        checked={filters.birthyear.includes(year)}
                        onChange={() => toggleBirthYear(year)}
                      />
                      {year}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Birthstar multi-select */}
          <div className="ps-field">
            <label className="ps-label">Birthstar</label>
            <div style={{ position: "relative" }}>
              <button type="button" className="ps-input ps-select"
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span style={{ color: filters.birthstar.length > 0 ? "var(--ink)" : "var(--ink-4)" }}>
                  {filters.birthstar.length > 0 ? `${filters.birthstar.length} star${filters.birthstar.length > 1 ? "s" : ""} selected` : "Select Birth Stars"}
                </span>
                {filters.birthstar.length > 0 && (
                  <span onClick={(e) => { e.stopPropagation(); setFilters(prev => ({ ...prev, birthstar: [] })); }}
                    style={{ fontSize: "11px", color: "var(--ink-3)", marginLeft: "6px", cursor: "pointer" }}>✕</span>
                )}
              </button>
              {filters.birthstar.length > 0 && (
                <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--ink-3)", lineHeight: 1.6 }}>
                  {filters.birthstar.map(v => enums.birthstar.options.find(o => o.enumvalue === v)?.strvalue).filter(Boolean).join(" · ")}
                </div>
              )}
              {open && (
                <div style={{ position: "absolute", zIndex: 10, top: "100%", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: "200px", overflowY: "auto", marginTop: "4px" }}>
                  {enums.birthstar.options.map(o => (
                    <label key={o.enumvalue} onClick={e => e.stopPropagation()}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "13px" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <input type="checkbox"
                        style={{ width: "13px", height: "13px", accentColor: "var(--amber)" }}
                        checked={filters.birthstar.includes(o.enumvalue)}
                        onChange={() => toggleBirthStar(o.enumvalue)}
                      />
                      {o.strvalue}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ps-field">
            <label className="ps-label">City</label>
            <input className="ps-input" name="city" placeholder="City or town" value={filters.city} onChange={onChange} />
          </div>

          <div className="ps-field">
            <label className="ps-label">State</label>
            <input className="ps-input" name="state" placeholder="State or province" value={filters.state} onChange={onChange} />
          </div>

          <div className="ps-field">
            <label className="ps-label">Min Height</label>
            <HeightPicker
              valueCm={filters.minHeight}
              onChange={(cm) => setFilters(prev => ({ ...prev, minHeight: cm }))}
            />
          </div>

          <div className="ps-field">
            <label className="ps-label">Max Height</label>
            <HeightPicker
              valueCm={filters.maxHeight}
              onChange={(cm) => setFilters(prev => ({ ...prev, maxHeight: cm }))}
            />
          </div>

          <div className="ps-field">
            <label className="ps-label">Gender</label>
            <select className="ps-input ps-select" name="gender" value={filters.gender} onChange={onChange}>
              <option value="">All</option>
              <option value="1">Male</option>
              <option value="2">Female</option>
            </select>
          </div>

          <div className="ps-field">
            <label className="ps-label">Status</label>
            <select className="ps-input ps-select" value={filters.status}
              onChange={e => setFilters({ ...filters, status: Number(e.target.value) })}>
              <option value={0}>All</option>
              <option value={1}>Active</option>
              <option value={2}>Inactive</option>
            </select>
          </div>

          {/* <div className="ps-field">
            <label className="ps-label">Education</label>
            <input className="ps-input"  name="education"  placeholder="Enter education" value={filters.education} onChange={onChange}  />
          </div> */}


          <div className="ps-field">
            <label className="ps-label">Swagothram</label>
            <select name="swagothra" className="ps-input ps-select" value={filters.swagothra} onChange={onChange}>
              <option value="">All Gothras</option>
              {gothras.map(g => (
                <option key={g.id} value={g.id}>{g.gothraname}</option>
              ))}
            </select>
          </div>

          <div className="ps-field">
            <label className="ps-label">Min Income</label>
            <input className="ps-input" name="income" placeholder="in lakhs" value={filters.income} onChange={onChange} />
          </div>

          <div className="ps-field">
            <label className="ps-label">Min Networth</label>
            <input className="ps-input" name="networth" placeholder="in crores" value={filters.networth} onChange={onChange} />
          </div>

          {/* Occupation multi-select */}
          <div className="ps-field">
            <label className="ps-label">Occupation</label>
            <div style={{ position: "relative" }}>
              <button type="button" className="ps-input ps-select"
                onClick={(e) => { e.stopPropagation(); setOpenOcc(!openOcc); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span style={{ color: filters.occtype.length > 0 ? "var(--ink)" : "var(--ink-4)" }}>
                  {filters.occtype.length > 0 ? `${filters.occtype.length} selected` : "Select Occupation"}
                </span>
                {filters.occtype.length > 0 && (
                  <span onClick={(e) => { e.stopPropagation(); setFilters(prev => ({ ...prev, occtype: [] })); }}
                    style={{ fontSize: "11px", color: "var(--ink-3)", marginLeft: "6px", cursor: "pointer" }}>✕</span>
                )}
              </button>
              {filters.occtype.length > 0 && (
                <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--ink-3)", lineHeight: 1.6 }}>
                  {filters.occtype.map(v => enums.occtype.options.find(o => o.enumvalue === v)?.strvalue).filter(Boolean).join(" · ")}
                </div>
              )}
              {openOcc && (
                <div style={{ position: "absolute", zIndex: 20, top: "100%", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: "160px", overflowY: "auto", marginTop: "4px" }}>
                  {enums.occtype.options.map(o => (
                    <label key={o.enumvalue} onClick={e => e.stopPropagation()}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "13px" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <input type="checkbox"
                        style={{ width: "13px", height: "13px", accentColor: "var(--amber)" }}
                        checked={filters.occtype.includes(o.enumvalue)}
                        onChange={() => toggleOccType(o.enumvalue)}
                      />
                      <span>{o.strvalue}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {filters.occtype.length > 0 && (
            <div className="ps-field">
              <label className="ps-label">Profession</label>
              <input
                className="ps-input"
                name="otherProfession"
                placeholder="Type profession (e.g. Doctor, Engineer)"
                value={filters.otherProfession}
                onChange={onChange}
              />
            </div>
          )}


          {admin && <>
            <div className="ps-field">
              <label className="ps-label">Subscription</label>
              <select className="ps-input ps-select" value={subFilter} onChange={handleSubFilter}>
                <option value="">All</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="diamond">Diamond</option>
              </select>
            </div>
            <div className="ps-field">
              <label className="ps-label">Payment Status</label>
              <select className="ps-input ps-select" value={payFilter} onChange={handlePayFilter}>
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </>}

        </div>
        <div className="ps-filter-footer">
          <span className="ps-results-count">{profiles.length} of {total} profile{total !== 1 ? "s" : ""} found</span>
          <button className="ps-search-btn" onClick={() => load(1)}>
            Search
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8.5 8.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── View toggle — below search bar ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0 4px" }}>
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
          <button
            onClick={() => setViewMode("tile")}
            title="Tile view"
            style={{
              padding: "6px 12px", border: "none", cursor: "pointer",
              background: viewMode === "tile" ? "var(--amber, #f59e0b)" : "var(--surface)",
              color:      viewMode === "tile" ? "#fff" : "var(--ink-3)",
              display: "flex", alignItems: "center", gap: "5px", fontSize: "12px",
              transition: "background 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
            Tile
          </button>
          <button
            onClick={() => setViewMode("list")}
            title="List view"
            style={{
              padding: "6px 12px", border: "none", borderLeft: "1px solid var(--border)", cursor: "pointer",
              background: viewMode === "list" ? "var(--amber, #f59e0b)" : "var(--surface)",
              color:      viewMode === "list" ? "#fff" : "var(--ink-3)",
              display: "flex", alignItems: "center", gap: "5px", fontSize: "12px",
              transition: "background 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            List
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {profiles.length === 0 ? (
        <div className="ps-empty">
          <div className="ps-empty-icon">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="ps-empty-title">No profiles found</p>
          <p className="ps-empty-sub">Try adjusting your filters or add a new profile</p>
          <Link to="/profiles/new" className="ps-add-btn" style={{ marginTop: 12 }}>Add Profile</Link>
        </div>

      ) : viewMode === "tile" ? (
        /* ── Tile grid — multiple cards ── */
        <div style={{
          display: "grid",
          // gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "16px",
        }}>
          {profiles.map((p, i) => renderTileCard(p, i))}
        </div>

      ) : (
        /* ── List / table view ── */
        <div className="ps-table-wrap">
          <table className="ps-table">
            <thead>
              <tr>
                <th className="ps-th">Photo</th>
                <th className="ps-th">Name</th>
                <th className="ps-th">Birthdate</th>
                <th className="ps-th">Height</th>
                <th className="ps-th">Matches</th>
                <th className="ps-th">Status</th>
                <th className="ps-th">Income</th>
                <th className="ps-th">Networth</th>
                {admin && <>
                  <th className="ps-th">Registered On</th>
                  <th className="ps-th">Subscription</th>
                  <th className="ps-th">Payment</th>
                  <th className="ps-th">Plan Expiry</th>
                  <th className="ps-th">Last Interaction</th>
                </>}
                <th className="ps-th"></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, i) => {
                const plan = p.latestPlan;
                return (
                  <tr className="ps-tr" key={p.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <td className="ps-td">
                      <img
                        src={p.profilePicture?.file_url ? `http://localhost:8080${p.profilePicture.file_url}` : "/assets/defaultProfile.png"}
                        alt={p.firstname} className="ps-table-avatar"
                        style={{ cursor: "pointer" }}
                        onClick={() => setPreviewIndex(i)}
                      />
                    </td>
                    <td className="ps-td">
                      <Link to={`/profiles/${p.id}`} style={{ textDecoration: "none" }}>
                        <p className="ps-table-name" style={{ cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.color = "var(--amber)"}
                          onMouseLeave={e => e.currentTarget.style.color = ""}>
                          {p.firstname} {p.lastname}
                        </p>
                      </Link>
                      <p className="ps-table-id">#{p.client_id}</p>
                    </td>
                    <td className="ps-td ps-td-meta">
                      {p.birthdate ? new Date(p.birthdate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                    </td>
                    <td className="ps-td ps-td-meta">{formatHeight(p.height) || "—"}</td>
                    <td className="ps-td">
                      <button className="ps-match-pill"
                        onClick={() => navigate(`/profiles/${p.id}/match`, { state: { fromProfile: location.pathname } })}>
                        {p.matchcount || 0}
                      </button>
                    </td>
                    <td className="ps-td">
                      <span className={`badge ${p.profilests === 1 ? "badge-teal" : "badge-neutral"}`}>
                        {p.profilests === 1 ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="ps-td ps-td-meta">{p.income || "—"}</td>
                    <td className="ps-td ps-td-meta">{p.networth || "—"}</td>
                    {admin && <>
                      <td className="ps-td ps-td-meta">
                        {p.createdon ? new Date(p.createdon).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "N/A"}
                      </td>
                      <td className="ps-td">
                        {plan?.subscription_name
                          ? <span className="badge badge-neutral">{subLabel[plan.subscription_name] || plan.subscription_name}</span>
                          : <span style={{ color: "var(--ink-3)" }}>—</span>}
                      </td>
                      <td className="ps-td">
                        <PaymentBadge status={plan?.payment_status || "unpaid"} expiryDate={plan?.plan_expiry} />
                      </td>
                      <td className="ps-td ps-td-meta">
                        {plan?.plan_expiry ? new Date(plan.plan_expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : <span style={{ color: "var(--ink-3)" }}>—</span>}
                      </td>
                      <td className="ps-td ps-td-meta">
                        {p.last_interaction ? new Date(p.last_interaction).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "Never"}
                      </td>
                    </>}
                    <td className="ps-td" style={{ position: "relative", textAlign: "center" }}>
                      <button className="ps-action-btn" style={{ padding: "6px 10px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPopoverPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX - 100 });
                          setOpenAction(openAction === p.id ? null : p.id);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "24px 0" }}>
          <button className="btn-secondary" onClick={() => load(page - 1)} disabled={page === 1}>← Prev</button>
          <span style={{ fontSize: "13px", color: "var(--ink-2)" }}>
            Page {page} of {pages} &nbsp;·&nbsp; {total} total
          </span>
          <button className="btn-secondary" onClick={() => load(page + 1)} disabled={page === pages}>Next →</button>
        </div>
      )}

    </div>
  );
}