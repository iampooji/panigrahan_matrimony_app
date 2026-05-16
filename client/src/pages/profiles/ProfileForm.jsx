import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProfile, getProfile, updateProfile } from "../../logic/profiles.logic";
import { getGothras } from "../../logic/gothras.logic";
import { loadFormEnums } from "../../logic/enumStore";
// import EducationSection from "../../components/education/EducationSection";

// ─── Height helpers ───────────────────────────────────────────────────────────
const FEET_OPTIONS   = [4, 5, 6, 7];
const INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => i);

const cmToFeetInches = (cm) => {
  if (!cm && cm !== 0) return { feet: "", inches: "" };
  const total  = parseFloat(cm) / 2.54;
  const feet   = Math.floor(total / 12);
  const inches = Math.round(total % 12);
  if (inches === 12) return { feet: feet + 1, inches: 0 };
  return { feet, inches };
};

const feetInchesToCm = (feet, inches) => {
  const f = parseInt(feet)   || 0;
  const i = parseInt(inches) || 0;
  if (feet === "" && inches === "") return "";
  return ((f * 12 + i) * 2.54).toFixed(2);
};

// ─── HeightPicker ─────────────────────────────────────────────────────────────
export function HeightPicker({ valueCm, onChange }) {
  const { feet: initFt, inches: initIn } = cmToFeetInches(valueCm);
  const [feet,   setFeet]   = useState(initFt);
  const [inches, setInches] = useState(initIn);

  // Sync back if parent resets (e.g. on edit load)
  useEffect(() => {
    const { feet: f, inches: i } = cmToFeetInches(valueCm);
    setFeet(f);
    setInches(i);
  }, [valueCm]);

  const handleFeet = (e) => {
    const f = e.target.value;
    setFeet(f);
    onChange(feetInchesToCm(f, inches));
  };

  const handleInches = (e) => {
    const i = e.target.value;
    setInches(i);
    onChange(feetInchesToCm(feet, i));
  };

  const preview = (feet !== "" || inches !== "")
    ? `${feet || 0} ft ${inches || 0} in · ${parseFloat(feetInchesToCm(feet || 0, inches || 0)).toFixed(0)} cm`
    : null;

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <select className="pf-input pf-select" value={feet} onChange={handleFeet} style={{ flex: 1 }}>
          <option value="">ft</option>
          {FEET_OPTIONS.map(f => (
            <option key={f} value={f}>{f} ft</option>
          ))}
        </select>
        <select className="pf-input pf-select" value={inches} onChange={handleInches} style={{ flex: 1 }}>
          <option value="">in</option>
          {INCHES_OPTIONS.map(i => (
            <option key={i} value={i}>{i} in</option>
          ))}
        </select>
      </div>
      {preview && (
        <div style={{ fontSize: "11px", color: "var(--ink-3)", marginTop: "4px", paddingLeft: "2px" }}>
          {preview}
        </div>
      )}
    </div>
  );
}

const SUBSCRIPTION_PLANS = [
  { name: "bronze",  label: "Bronze",  duration: "6 months"  },
  { name: "silver",  label: "Silver",  duration: "12 months" },
  { name: "gold",    label: "Gold",    duration: "24 months" },
  { name: "diamond", label: "Diamond", duration: "36 months" },
];

export default function ProfileForm() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const isEdit      = Boolean(id);
  const backTo      = location.state?.fromProfile || "/profiles";

  const [form, setForm] = useState({
    client_id: "",
    firstname: "",
    middlei: "",
    lastname: "",
    familyname: "",
    birthdate: "",
    birthtime: "",
    birthplace: "",
    color: "",
    weight: "",
    birthrasi: "",
    birthstar: "",
    starpada: "",
    swagothra: "",
    mamagothra: "",
    height: "",
    gender: "",
    phonenumber: "",
    email: "",
    borym: null,
    broe: null,
    broem: null,
    broy: null,
    sise: null,
    sisem: null,
    sisy: null,
    sisym: null,
    hastwin: null,
    maritalsts: "",
    childrencount: "",
    networth: "",
    income: "",
    assetdets: "",
    // education1: "",
    // almamater: "",
    // education2: "",
    // almamater2: "",
    // udeducation: "",
    // birthdistrict: "",
    // birthstate: "",
    // familygod: "",
  });

  const [loading, setLoading] = useState(false);
  const [enums,   setEnums]   = useState(null);
  const [profileStatus, setProfileStatus] = useState(null);
  const [gothras, setGothras] = useState([]);
  const [selectedGothra, setSelectedGothra] = useState(null);
  const [selectedMamaGothra, setSelectedMamaGothra] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadFormEnums("profile").then(setEnums).catch(() => setEnums({}));
    getGothras().then(data => setGothras(data || [])).catch(() => setGothras([]));

    if (!isEdit) return;
    setLoading(true);
    getProfile(id).then((data) => {
      setForm((prev) => ({ ...prev, ...data }));
      setProfileStatus(data.profilests);
      setLoading(false);
    });
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
   setForm(prev => ({ ...prev, [name]: value })); //to overcome stale state issue

    if (name === "gothra") {
      const g = gothras.find(x => x.id === Number(value));
      setSelectedGothra(g);
    }
    if (name === "mamagothra") {
      const g = gothras.find(x => x.id === Number(value));
      setSelectedMamaGothra(g);
    }

  };

  const submit = async (e) => {
    e.preventDefault();
    setErrors({}); // reset errors

    try {
      if (isEdit) {
        await updateProfile(id, form);
        navigate(`/profiles/${id}`);
      } else {
        const created = await createProfile(form);
        navigate(`/profiles/${created.id}`);
      }
    } catch (err) {
        const field = err?.response?.data?.field;
        const message = err?.response?.data?.message;

        if (field) {
          setErrors({ [field]: message });
        } else {
          alert("Failed to save profile");
        }
      }
  };

  const maritalStatusName =
  enums?.maritalsts?.options?.find(
    o => String(o.enumvalue) === String(form.maritalsts)
  )?.strvalue?.toLowerCase();

  const showChildrenField =
  maritalStatusName === "divorced" || maritalStatusName === "widow";

  if (loading || !enums) return <div className="ps-loading"><div className="ps-spinner" /></div>;

  return (
    <div className="pf-page">
      <div className="pf-header">
        <div>
          <p className="ps-header-eyebrow">{isEdit ? "Editing" : "New"}</p>
          <h1 className="ps-header-title">{isEdit ? "Edit Profile" : "Create Profile"}</h1>
          <div className="ps-header-bar" />
        </div>
        <button type="button" className="btn-secondary" onClick={() => navigate(backTo)}>← Back</button>
      </div>

      <form onSubmit={submit} className="pf-form" noValidate>

        {/* ══ PERSONAL INFO ══ */}
        <div className="pf-card">
          <div className="pf-card-header">
            <h2 className="pf-card-title">Personal Information</h2>
            <p className="pf-card-sub">Basic personal details</p>
          </div>
          <div className="pf-grid">
            {[
              { label: "Client ID",   name: "client_id",  placeholder: "Client ID", isClientId: true },
              
              { label: "First Name",  name: "firstname",  placeholder: "First name"  },
              { label: "Middle Name", name: "middlei",    placeholder: "Middle name" },
              { label: "Last Name",   name: "lastname",   placeholder: "Last name"   },
              { label: "Family Name", name: "familyname", placeholder: "Family name" },
            ].map(f => (
              <div className="pf-field" key={f.name}>
                <label className="pf-label">{f.label}</label>
                <input className="pf-input" name={f.name} type={f.type || "text"}
                  placeholder={f.placeholder} value={form[f.name] || ""} onChange={onChange} 
                  required={f.isClientId && !isEdit}  
                  style={{
                    border: errors[f.name] ? "1px solid red" : ""}}/>
                  {f.isClientId && isEdit && form.client_id && (
                    <div style={{ fontSize: "11px", color: "gray", marginTop: "4px" }}>
                    </div>
                  )}
                  {errors[f.name] && (
                    <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                      {errors[f.name]}
                    </div>
                  )}
              </div>
            ))}

            <div className="pf-field" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <label className="pf-label">Gender</label>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", paddingTop: "4px" }}>
                {enums?.gender?.options?.map(e => (
                  <label key={e.enumvalue} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "var(--ink-2)", cursor: "pointer" }}>
                    <input type="radio" name="gender" value={e.enumvalue}
                      checked={form.gender == e.enumvalue} onChange={onChange}
                      style={{ accentColor: "var(--amber)", width: "13px", height: "13px" }} />
                    {e.strvalue}
                  </label>
                ))}
              </div>
            </div>

            {[
              { label: "Birth Place",    name: "birthplace",  placeholder: "City / Town",  },
              { label: "Weight",         name: "weight",      placeholder: "e.g. 65 kg" },
              { label: "Phone Number",   name: "phonenumber", placeholder: "Phone number", type: "tel" },
              { label: "Email",          name: "email",       placeholder: "Email address", type: "email" },
              // { label: "Family God",     name: "familygod",   placeholder: "Family deity" },
              // { label: "Birth State",    name: "birthstate",  placeholder: "State"          },
              // { label: "Birth District", name: "birthdist",   placeholder: "District"       },
            ].map(f => (
              <div className="pf-field" key={f.name}>
                <label className="pf-label">{f.label}</label>
                <input className="pf-input" name={f.name} type={f.type || "text"}
                  placeholder={f.placeholder} value={form[f.name] || ""} onChange={onChange} />
              </div>
            ))}

            {/* ── Height picker ── */}
            <div className="pf-field">
              <label className="pf-label">Height</label>
              <HeightPicker
                valueCm={form.height}
                onChange={(cm) => setForm(prev => ({ ...prev, height: cm }))}
              />
            </div>

            <div className="pf-field">
              <label className="pf-label">Birth Date</label>
              <input className="pf-input" type="date" name="birthdate" value={form.birthdate || ""} onChange={onChange} />
            </div>
            <div className="pf-field">
              <label className="pf-label">Birth Time</label>
              <input className="pf-input" type="time" name="birthtime" value={form.birthtime || ""} onChange={onChange} />
            </div>

            {[
              { label: "Color / Complexion", name: "color",      enumKey: "color",      placeholder: "Select complexion" },
              { label: "Birth Star",         name: "birthstar",  enumKey: "birthstar",  placeholder: "Select birth star" },
              { label: "Birth Pada",         name: "starpada",   enumKey: "birthpada",  placeholder: "Select pada"       },
              { label: "Birth Rashi",        name: "birthrasi",  enumKey: "birthrasi",  placeholder: "Select birth rashi"},
              { label: "Marital Status",     name: "maritalsts", enumKey: "maritalsts", placeholder: "Select status"     },
            ].map(f => (
              <div className="pf-field" key={f.name}>
                <label className="pf-label">{f.label}</label>
                <select className="pf-input pf-select" name={f.name} value={form[f.name] || ""} onChange={onChange}>
                  <option value="">{f.placeholder}</option>
                  {enums?.[f.enumKey]?.options?.map(e => (
                    <option key={e.enumvalue} value={e.enumvalue}>{e.strvalue}</option>
                  ))}
                </select>
              </div>
            ))}

            {showChildrenField && (
            <div className="pf-field">
              <label className="pf-label">Number of Children</label>
              <input
                type="number"
                className="pf-input"
                name="childrencount"
                placeholder="Enter number of children"
                value={form.childrencount || ""}
                onChange={onChange}
                min="0"
              />
            </div>
          )}

            <div className="pf-field pf-field-full">
              <label className="pf-label">Swagothram</label>
              <select name="swagothra" value={form.swagothra || ""}
                className="w-full border rounded-md px-3 py-2"
                onChange={(e) => {
                  const gid = Number(e.target.value);
                  const gothra = gothras.find(g => g.id === gid);
                  setForm({ ...form, swagothra: gid, swagothraname: gothra?.gothraname || "" });
                  setSelectedGothra(gothra);
                }}
              >
                <option value="">Select Gothra</option>
                {gothras.map(g => (
                  <option key={g.id} value={g.id}>{g.gothraname}</option>
                ))}
              </select>
              {selectedGothra && (
                <div className="text-xs text-gray-400 mt-1 ml-1">
                  {selectedGothra.gothrarushi} Rushi | Gothra No: {selectedGothra.gothranum}
                </div>
              )}
            </div>

            <div className="pf-field pf-field-full">
              <label className="pf-label">Mama Gothram</label>
              <select name="mamagothra" value={form.mamagothra || ""}
                className="w-full border rounded-md px-3 py-2"
                onChange={(e) => {
                  const gid = Number(e.target.value);
                  const gothra = gothras.find(g => g.id === gid);
                  setForm({ ...form, mamagothra: gid, mamagothraname: gothra?.gothraname || "" });
                  setSelectedMamaGothra(gothra);
                }}
              >
                <option value="">Select Gothra</option>
                {gothras.map(g => (
                  <option key={g.id} value={g.id}>{g.gothraname}</option>
                ))}
              </select>
              {selectedMamaGothra && (
                <div className="text-xs text-gray-400 mt-1 ml-1">
                  {selectedMamaGothra.gothrarushi} Rushi | Gothra No: {selectedMamaGothra.gothranum}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ EDUCATION ══ */}
        {/* <div className="pf-card">
          <div className="pf-card-header">
            <h2 className="pf-card-title">Education Details</h2>
            <p className="pf-card-sub">Qualifications and institutions</p>
          </div>
          <div className="pf-grid">
            {[
              { label: "Education 1",          name: "education1",  placeholder: "PUC / Bachelors"           },
              { label: "College / University", name: "almamater",   placeholder: "Institution name"          },
              { label: "Education 2",          name: "education2",  placeholder: "Masters / Specialisation"  },
              { label: "College / University", name: "almamater2",   placeholder: "Institution name"          },
              { label: "Other Education",      name: "udeducation", placeholder: "Any other details"         },
            ].map(f => (
              <div className="pf-field" key={f.name}>
                <label className="pf-label">{f.label}</label>
                <input className="pf-input" name={f.name} placeholder={f.placeholder} value={form[f.name] || ""} onChange={onChange} />
              </div>
            ))}
          </div>
        </div> */}

        {/* {isEdit && (
          <div className="pf-card">
            <div className="pf-card-header">
              <h2 className="pf-card-title">Education</h2>
              <p className="pf-card-sub">Add and manage education details</p>
            </div>

            <EducationSection profile_id={id} />
          </div>
        )} */}



        {/* ══ FAMILY ══ */}
        <div className="pf-card">
          <div className="pf-card-header">
            <h2 className="pf-card-title">Family Details</h2>
            <p className="pf-card-sub">Siblings and twin information</p>
          </div>
          <div className="pf-grid">
            {[
              { label: "Elder Brothers",           name: "broe",  placeholder: "Count"         },
              { label: "Elder Brothers Married",   name: "broem", placeholder: "Count married" },
              { label: "Younger Brothers",         name: "broy",  placeholder: "Count"         },
              { label: "Younger Brothers Married", name: "borym", placeholder: "Count married" },
              { label: "Elder Sisters",            name: "sise",  placeholder: "Count"         },
              { label: "Elder Sisters Married",    name: "sisem", placeholder: "Count married" },
              { label: "Younger Sisters",          name: "sisy",  placeholder: "Count"         },
              { label: "Younger Sisters Married",  name: "sisym", placeholder: "Count married" },
            ].map(f => (
              <div className="pf-field" key={f.name}>
                <label className="pf-label">{f.label}</label>
                <input className="pf-input" name={f.name} placeholder={f.placeholder} value={form[f.name] || ""} onChange={onChange} />
              </div>
            ))}
            <div className="pf-field">
              <label className="pf-label">Has Twin</label>
              <select className="pf-input pf-select" name="hastwin" value={form.hastwin || ""} onChange={onChange}>
                <option value="">Select</option>
                {enums?.hastwin?.options?.map(e => (
                  <option key={e.enumvalue} value={e.enumvalue}>{e.strvalue}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pf-card">
          <div className="pf-card-header">
            <h2 className="pf-card-title">Income Details</h2>
            <p className="pf-card-sub">Annual Income and assets information</p>
          </div>

          <div className="pf-grid">
            {[
              { label: "Asset Details", name: "assetdets", placeholder: "", type: "textarea", rows: 4 },
              { label: "Asset Value", name: "networth", placeholder: "In Crores" },
              { label: "Annual Income", name: "income", placeholder: "Annual Income in Lakhs" },
            ].map(f => (
              <div
                className="pf-field"
                key={f.name}
                style={f.type === "textarea" ? { gridColumn: "1 / -1" } : {}}
              >
                <label className="pf-label">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea className="pf-input" name={f.name} placeholder={f.placeholder} rows={f.rows} value={form[f.name] || ""} onChange={onChange}/>
                ) : (
                  <input className="pf-input" name={f.name} placeholder={f.placeholder} value={form[f.name] || ""} onChange={onChange}/>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ══ ACTIONS ══ */}
        <div className="pf-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(backTo)}>Cancel</button>
          <button type="submit" className="ps-search-btn">
            {isEdit ? "Update Profile" : "Create Profile"}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}