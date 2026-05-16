import { useRef, useState } from "react";

const EMPTY_ADDR = {
  addone: "", addtwo: "", city: "",
  district: "", state: "", country: "", zipcode: ""
};

const PLACEHOLDERS = {
  addone: "Address Line 1", addtwo: "Address Line 2", city: "City",
  district: "District", state: "State", country: "Country", zipcode: "Zipcode"
};

const FIELDS = ["addone", "addtwo", "city", "district", "state", "country", "zipcode"];

const VALIDATORS = {
  city:     { pattern: /^[a-zA-Z\s]*$/, message: "Only letters allowed" },
  district: { pattern: /^[a-zA-Z\s]*$/, message: "Only letters allowed" },
  state:    { pattern: /^[a-zA-Z\s]*$/, message: "Only letters allowed" },
  country:  { pattern: /^[a-zA-Z\s]*$/, message: "Only letters allowed" },
  zipcode:  { pattern: /^[0-9]*$/,      message: "Only numbers allowed" }
};

const labelStyle = {
  display: "block", fontSize: "10.5px", fontWeight: 600,
  letterSpacing: ".06em", textTransform: "uppercase",
  color: "var(--ink-3)", marginBottom: "5px"
};

const validate = (field, value) => {
  if (!value) return null;
  const rule = VALIDATORS[field];
  return rule ? (rule.pattern.test(value) ? null : rule.message) : null;
};

const validateAll = (formData) => {
  const errors = {};
  FIELDS.forEach(field => {
    const err = validate(field, formData[field]);
    if (err) errors[field] = err;
  });
  return errors;
};

function FieldGroup({ field, name, value, onChange, onBlur, disabled, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={labelStyle}>{PLACEHOLDERS[field]}</label>
      <input
        name={name} value={value || ""} onChange={onChange} onBlur={onBlur}
        placeholder={PLACEHOLDERS[field]} disabled={disabled}
        style={{
          display: "block", width: "100%", height: "44px",
          padding: "0 13px", borderRadius: "var(--r-sm)",
          border: `1.5px solid ${error ? "var(--danger)" : "var(--border)"}`,
          background: disabled ? "var(--bg-2)" : error ? "rgba(192,57,43,.04)" : "var(--bg)",
          color: "var(--ink)", fontFamily: "var(--font-ui)", fontSize: "13.5px",
          outline: "none", opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "text",
          transition: "border-color 160ms ease, box-shadow 160ms ease"
        }}
        onFocus={e => {
          if (!disabled) {
            e.target.style.borderColor = error ? "var(--danger)" : "var(--amber)";
            e.target.style.boxShadow   = error ? "0 0 0 3px rgba(192,57,43,.15)" : "0 0 0 3px var(--amber-ring)";
          }
        }}
      />
      {error && (
        <span style={{ fontSize: "11px", color: "var(--danger)", fontWeight: 500, marginTop: "2px" }}>
          ⚠ {error}
        </span>
      )}
    </div>
  );
}

const TYPE_CONFIG = {
  current:             { label: "Current Address",             icon: "◎",      color: "var(--amber)", accent: "linear-gradient(to bottom, var(--amber), var(--rose-light))" },
  permanent:           { label: "Permanent Address",           icon: "⌂",      color: "var(--teal)",  accent: "linear-gradient(to bottom, var(--teal), var(--teal-light))" },
  work:                { label: "Work Address",                icon: "⚑",      color: "#5d8ac4",      accent: "linear-gradient(to bottom, #5d8ac4, #7aa3d4)" },
  "current-permanent": { label: "Current / Permanent Address", icon: "◎ / ⌂", color: "var(--amber)", accent: "linear-gradient(to bottom, var(--amber), #2a7a72)" }
};

const typeBadgeStyle = (type) => {
  const configs = {
    current:             { background: "var(--amber-dim)",          color: "var(--amber)", border: "1px solid rgba(200,105,42,.3)" },
    permanent:           { background: "var(--teal-dim)",           color: "var(--teal)",  border: "1px solid rgba(42,122,114,.3)" },
    work:                { background: "rgba(93,138,196,.12)",      color: "#5d8ac4",      border: "1px solid rgba(93,138,196,.3)" },
    "current-permanent": { background: "linear-gradient(90deg, var(--amber-dim), var(--teal-dim))", color: "var(--ink-2)", border: "1px solid var(--border)" }
  };
  return {
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "5px 14px", borderRadius: "9999px",
    fontSize: "11px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
    ...(configs[type] || configs.current)
  };
};

/* ── Merge checkbox ──
   Shown in single-type edit when the opposite address exists.
   Label depends on which type is being edited.
── */
function MergeCheckbox({ editType, checked, onChange }) {
  const label = editType === "current"
    ? "Set Permanent address same as this"
    : "Set Current address same as this";

  return (
    <label style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "12px 14px", borderRadius: "var(--r-sm)",
      background: checked ? "var(--teal-dim)" : "var(--bg-2)",
      border: `1.5px solid ${checked ? "rgba(42,122,114,.3)" : "var(--border)"}`,
      cursor: "pointer", margin: "16px 0", transition: "all 160ms ease"
    }}>
      <input type="checkbox" checked={checked} onChange={onChange}
        style={{ width: "16px", height: "16px", accentColor: "var(--teal)", cursor: "pointer" }} />
      <span style={{ fontSize: "13px", fontWeight: 600, color: checked ? "var(--teal)" : "var(--ink-3)" }}>
        {label}
      </span>
      {checked && (
        <span style={{
          marginLeft: "auto", fontSize: "10px", fontWeight: 700,
          letterSpacing: ".06em", textTransform: "uppercase",
          color: "var(--teal)", background: "var(--teal-dim)",
          padding: "2px 8px", borderRadius: "9999px"
        }}>
          Will merge
        </span>
      )}
    </label>
  );
}

/* ── LivingWithParentsCheckbox ──
   Shown in profile address form (add and edit, including merged card)
   when a parent family member is linked.
   When checked: signals that all linked parent addresses should be
   set to match this profile address on save.
   When unchecked after being checked: sync is skipped, family address
   is left as-is (restore of old value happens naturally since we never
   overwrote it until Save was clicked).
── */
function LivingWithParentsCheckbox({ checked, onChange }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "12px 14px", borderRadius: "var(--r-sm)",
      background: checked ? "rgba(93,138,196,.10)" : "var(--bg-2)",
      border: `1.5px solid ${checked ? "rgba(93,138,196,.35)" : "var(--border)"}`,
      cursor: "pointer", margin: "16px 0", transition: "all 160ms ease"
    }}>
      <input
        type="checkbox" checked={checked} onChange={onChange}
        style={{ width: "16px", height: "16px", accentColor: "#5d8ac4", cursor: "pointer" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: checked ? "#5d8ac4" : "var(--ink-3)" }}>
          Living with parents (same address as family)
        </span>
        <span style={{ fontSize: "11px", color: "var(--ink-4)", fontWeight: 400 }}>
          Family member's address will be updated to match this address on save
        </span>
      </div>
      {checked && (
        <span style={{
          marginLeft: "auto", flexShrink: 0,
          fontSize: "10px", fontWeight: 700,
          letterSpacing: ".06em", textTransform: "uppercase",
          color: "#5d8ac4", background: "rgba(93,138,196,.12)",
          padding: "2px 8px", borderRadius: "9999px",
          border: "1px solid rgba(93,138,196,.3)"
        }}>
          Will sync
        </span>
      )}
    </label>
  );
}

// ── hasFamilyMember: true when this form is for a profile that has a
//    linked family member — controls visibility of the living-with-parents checkbox.
// ── familyAddresses: the family member's current saved addresses,
//    used to restore them if the checkbox is unchecked after being checked.
export default function AddressForm({ value, onSave, onCancel, hasFamilyMember, familyAddresses }) {
  const isEdit   = Boolean(value);
  const editType = value?.address_type;
  const isMerged = editType === "current-permanent";
  // Single-type edit — does the opposite address exist?
  const hasOpposite = Boolean(value?.has_opposite) && (editType === "current" || editType === "permanent");

  // ── Edit mode state ──
  const [form, setForm]               = useState(isEdit ? { ...value } : { ...EMPTY_ADDR });
  const [editErrors, setEditErrors]   = useState({});
  // Merged edit — "still same?" checkbox
  const [keepMerged, setKeepMerged]   = useState(true);
  const [permForm, setPermForm]       = useState(isEdit ? { ...value } : { ...EMPTY_ADDR });
  const [permErrors, setPermErrors]   = useState({});
  // Single-type edit — "merge with opposite?" checkbox
  const [wantMerge, setWantMerge]     = useState(false);

  // ── Add mode state ──
  const [currentForm, setCurrentForm]         = useState({ ...EMPTY_ADDR });
  const [permanentForm, setPermanentForm]     = useState({ ...EMPTY_ADDR });
  const [workForm, setWorkForm]               = useState({ ...EMPTY_ADDR });
  const [sameAsCurrent, setSameAsCurrent]     = useState(false);
  const [currentErrors, setCurrentErrors]     = useState({});
  const [permanentErrors, setPermanentErrors] = useState({});
  const [workErrors, setWorkErrors]           = useState({});

  // ── Living with parents state ──
  // Active in both add and edit mode for a profile with a linked parent.
  // prevFamilyAddrRef holds a snapshot of the family address taken at the
  // moment the checkbox is first checked — so it can be restored on uncheck.
  const [livingWithParents, setLivingWithParents] = useState(false);
  const prevFamilyAddrRef = useRef(null);

  const handleLivingWithParentsChange = (e) => {
    const checked = e.target.checked;
    if (checked) {
      // Snapshot the current family addresses before they get overwritten
      prevFamilyAddrRef.current = familyAddresses
        ? { ...familyAddresses }
        : null;
    } else {
      prevFamilyAddrRef.current = null;
    }
    setLivingWithParents(checked);
  };

  /* ── Edit mode field handler ── */
  const onEditChange = e => {
    const { name, value: val } = e.target;
    setForm(prev => ({ ...prev, [name]: val }));
    // Keep perm in sync if merged + still same
    if (isMerged && keepMerged) setPermForm(prev => ({ ...prev, [name]: val }));
    if (editErrors[name]) setEditErrors(prev => ({ ...prev, [name]: null }));
  };

  const onPermChange = e => {
    const { name, value: val } = e.target;
    setPermForm(prev => ({ ...prev, [name]: val }));
    if (permErrors[name]) setPermErrors(prev => ({ ...prev, [name]: null }));
  };

  const onEditBlur = e => {
    const { name, value: val } = e.target;
    const err = validate(name, val);
    setEditErrors(prev => ({ ...prev, [name]: err }));
    e.target.style.borderColor = err ? "var(--danger)" : "var(--border)";
    e.target.style.boxShadow   = "none";
  };

  const onPermBlur = e => {
    const { name, value: val } = e.target;
    const err = validate(name, val);
    setPermErrors(prev => ({ ...prev, [name]: err }));
    e.target.style.borderColor = err ? "var(--danger)" : "var(--border)";
    e.target.style.boxShadow   = "none";
  };

  /* ── Add mode handler factory ── */
  const makeHandlers = (prefix, setter, setErrors, errors) => ({
    onChange: e => {
      const field   = e.target.name.replace(`${prefix}_`, "");
      const updated = prev => ({ ...prev, [field]: e.target.value });
      setter(updated);
      if (prefix === "current" && sameAsCurrent) setPermanentForm(updated);
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    },
    onBlur: e => {
      const field = e.target.name.replace(`${prefix}_`, "");
      const err   = validate(field, e.target.value);
      setErrors(prev => ({ ...prev, [field]: err }));
      e.target.style.borderColor = err ? "var(--danger)" : "var(--border)";
      e.target.style.boxShadow   = "none";
    }
  });

  const currentHandlers   = makeHandlers("current",   setCurrentForm,   setCurrentErrors,   currentErrors);
  const permanentHandlers = makeHandlers("permanent",  setPermanentForm, setPermanentErrors, permanentErrors);
  const workHandlers      = makeHandlers("work",       setWorkForm,      setWorkErrors,      workErrors);

  const onSameAsChange = e => {
    setSameAsCurrent(e.target.checked);
    if (e.target.checked) setPermanentForm({ ...currentForm });
  };

  /* ── Save ── */
  const handleSave = () => {
    if (isEdit) {
      const errors = validateAll(form);
      if (Object.values(errors).some(Boolean)) { setEditErrors(errors); return; }

      if (isMerged) {
        // Already-merged card
        if (keepMerged) {
          onSave({
            ...form,
            address_type: "current-permanent",
            ...(livingWithParents ? { livingWithParents: true } : {})
          });
        } else {
          const pErrs = validateAll(permForm);
          if (Object.values(pErrs).some(Boolean)) { setPermErrors(pErrs); return; }
          // Split into two rows — attach livingWithParents on the array if set
          const splitItems = [
            { ...form,     address_type: "current" },
            { ...permForm, address_type: "permanent" }
          ];
          if (livingWithParents) splitItems._livingWithParents = true;
          onSave(splitItems);
        }
      } else {
        // Single-type edit — pass wantMerge and/or livingWithParents flag if set
        onSave({
          ...form,
          ...(wantMerge         ? { wantMerge: true }         : {}),
          ...(livingWithParents ? { livingWithParents: true }  : {})
        });
      }
    } else {
      // Add mode
      const currErrs = validateAll(currentForm);
      const permErrs = sameAsCurrent ? {} : validateAll(permanentForm);
      const wrkErrs  = validateAll(workForm);
      if (Object.values(currErrs).some(Boolean)) { setCurrentErrors(currErrs); return; }
      if (Object.values(permErrs).some(Boolean)) { setPermanentErrors(permErrs); return; }
      if (Object.values(wrkErrs).some(Boolean))  { setWorkErrors(wrkErrs); return; }

      const items = [
        { address_type: "current",   ...currentForm },
        { address_type: "permanent", ...(sameAsCurrent ? currentForm : permanentForm) }
      ];
      const hasWork = Object.values(workForm).some(v => v);
      if (hasWork) items.push({ address_type: "work", ...workForm });
      // Flag for AddressSection to trigger family sync after bulk save.
      // Attached directly on the array (not inside any row object) so it
      // never reaches the backend as part of address data.
      if (livingWithParents) items._livingWithParents = true;
      onSave(items);
    }
  };

  const fields = (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px 16px" }}>
      {FIELDS.map(field => (
        <FieldGroup
          key={field} field={field} name={field}
          value={form[field]} onChange={onEditChange} onBlur={onEditBlur}
          disabled={false} error={editErrors[field]}
        />
      ))}
    </div>
  );

  return (
    <div style={{
      marginTop: "16px", background: "var(--surface)",
      border: "1px solid var(--border)", borderRadius: "var(--r-md)",
      overflow: "hidden", boxShadow: "var(--shadow-sm)",
      animation: "fadeUp .3s var(--smooth) both"
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 22px", borderBottom: "1px solid var(--border)",
        background: "var(--bg)", display: "flex", alignItems: "center", gap: "10px"
      }}>
        <span style={{
          width: "28px", height: "28px", borderRadius: "50%",
          background: "var(--amber-dim)", border: "1.5px solid rgba(200,105,42,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--amber)", fontSize: "14px"
        }}>⌂</span>
        <h4 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "17px", fontWeight: 400, color: "var(--ink)" }}>
          {isEdit ? `Edit ${TYPE_CONFIG[editType]?.label || "Address"}` : "Add Address"}
        </h4>
      </div>

      <div style={{ padding: "22px" }}>
        {isEdit ? (
          <>
            {/* Type badge */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Address Type</label>
              <div style={typeBadgeStyle(editType)}>
                {TYPE_CONFIG[editType]?.icon} {TYPE_CONFIG[editType]?.label}
              </div>
            </div>

            {/* Fields */}
            {fields}

            {/* ── Merged card: "keep same?" checkbox ── */}
            {isMerged && (
              <>
                <label style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 14px", borderRadius: "var(--r-sm)",
                  background: keepMerged ? "var(--teal-dim)" : "var(--bg-2)",
                  border: `1.5px solid ${keepMerged ? "rgba(42,122,114,.3)" : "var(--border)"}`,
                  cursor: "pointer", margin: "16px 0", transition: "all 160ms ease"
                }}>
                  <input type="checkbox" checked={keepMerged}
                    onChange={e => { setKeepMerged(e.target.checked); if (e.target.checked) setPermForm({ ...form }); }}
                    style={{ width: "16px", height: "16px", accentColor: "var(--teal)", cursor: "pointer" }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: keepMerged ? "var(--teal)" : "var(--ink-3)" }}>
                    Permanent address same as Current address
                  </span>
                  {keepMerged && (
                    <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--teal)", background: "var(--teal-dim)", padding: "2px 8px", borderRadius: "9999px" }}>
                      Same
                    </span>
                  )}
                </label>

                {/* Separate permanent fields when unchecked */}
                {!keepMerged && (
                  <div style={{ padding: "16px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: "linear-gradient(to bottom, var(--teal), var(--teal-light))" }} />
                    <div style={{ paddingLeft: "8px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "8px" }}>
                        ⌂ Permanent Address
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px 16px" }}>
                        {FIELDS.map(field => (
                          <FieldGroup
                            key={field} field={field} name={field}
                            value={permForm[field]} onChange={onPermChange} onBlur={onPermBlur}
                            disabled={false} error={permErrors[field]}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Single-type edit: "merge with opposite?" checkbox ── */}
            {hasOpposite && !isMerged && (
              <MergeCheckbox
                editType={editType}
                checked={wantMerge}
                onChange={e => setWantMerge(e.target.checked)}
              />
            )}

            {/* ── Living with parents checkbox ──
                Shown in all edit modes (single-type and merged) when a parent
                family member is linked to this profile.
            ── */}
            {hasFamilyMember && (
              <LivingWithParentsCheckbox
                checked={livingWithParents}
                onChange={handleLivingWithParentsChange}
              />
            )}
          </>
        ) : (
          <>
            {/* Add mode — Current */}
            <AddressSection type="current" form={currentForm} handlers={currentHandlers} errors={currentErrors} disabled={false} />

            {/* Same as current checkbox */}
            <label style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "12px 14px", borderRadius: "var(--r-sm)",
              background: sameAsCurrent ? "var(--teal-dim)" : "var(--bg-2)",
              border: `1.5px solid ${sameAsCurrent ? "rgba(42,122,114,.3)" : "var(--border)"}`,
              cursor: "pointer", margin: "16px 0", transition: "all 160ms ease"
            }}>
              <input type="checkbox" checked={sameAsCurrent} onChange={onSameAsChange}
                style={{ width: "16px", height: "16px", accentColor: "var(--teal)", cursor: "pointer" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: sameAsCurrent ? "var(--teal)" : "var(--ink-3)" }}>
                Permanent address same as Current address
              </span>
              {sameAsCurrent && (
                <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--teal)", background: "var(--teal-dim)", padding: "2px 8px", borderRadius: "9999px" }}>
                  Auto-filled
                </span>
              )}
            </label>

            {/* Permanent */}
            <AddressSection type="permanent" form={permanentForm} handlers={permanentHandlers} errors={permanentErrors} disabled={sameAsCurrent} />

            <div style={{ height: "16px" }} />

            {/* Work */}
            <AddressSection type="work" form={workForm} handlers={workHandlers} errors={workErrors} disabled={false} optional />

            {/* ── Living with parents checkbox (add mode) ──
                Shown when a parent family member is linked to this profile.
            ── */}
            {hasFamilyMember && (
              <LivingWithParentsCheckbox
                checked={livingWithParents}
                onChange={handleLivingWithParentsChange}
              />
            )}
          </>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "18px", borderTop: "1px solid var(--border)" }}>
          <button onClick={onCancel} className="btn-secondary" style={{ padding: "10px 22px", fontSize: "13px" }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{
            padding: "10px 28px", borderRadius: "var(--r-sm)", border: "none",
            background: "linear-gradient(110deg, var(--amber), var(--rose-light))",
            color: "#fff", fontSize: "13px", fontWeight: 700, letterSpacing: ".03em",
            cursor: "pointer", boxShadow: "0 4px 14px rgba(200,105,42,.3)",
            transition: "transform 160ms ease, box-shadow 160ms ease"
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(200,105,42,.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 4px 14px rgba(200,105,42,.3)"; }}
          >
            Save Address
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Internal section component (Add mode) ── */
function AddressSection({ type, form, handlers, errors, disabled, optional }) {
  const config = {
    current:   { label: "Current Address",   icon: "◎", color: "var(--amber)", accent: "linear-gradient(to bottom, var(--amber), var(--rose-light))" },
    permanent: { label: "Permanent Address", icon: "⌂", color: "var(--teal)",  accent: "linear-gradient(to bottom, var(--teal), var(--teal-light))" },
    work:      { label: "Work Address",      icon: "⚑", color: "#5d8ac4",      accent: "linear-gradient(to bottom, #5d8ac4, #7aa3d4)" }
  }[type];

  return (
    <div style={{
      padding: "16px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)",
      opacity: disabled ? 0.6 : 1, position: "relative", overflow: "hidden",
      transition: "opacity 160ms ease"
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: config.accent }} />
      <div style={{ paddingLeft: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: config.color, display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          <span>{config.icon}</span>
          {config.label}
          {optional && <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--ink-4)", textTransform: "none", letterSpacing: 0 }}>(optional)</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px 16px", marginTop: "10px" }}>
          {["addone","addtwo","city","district","state","country","zipcode"].map(field => (
            <FieldGroup
              key={field} field={field} name={`${type}_${field}`}
              value={form[field]} onChange={handlers.onChange} onBlur={handlers.onBlur}
              disabled={disabled} error={errors[field]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}