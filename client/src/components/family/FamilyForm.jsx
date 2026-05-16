import { useState } from "react";

const labelStyle = {
  display: "block",
  fontSize: "10.5px",
  fontWeight: 600,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  marginBottom: "5px"
};

const inputStyle = {
  display: "block",
  width: "100%",
  height: "44px",
  padding: "0 13px",
  borderRadius: "var(--r-sm)",
  border: "1.5px solid var(--border)",
  background: "var(--bg)",
  color: "var(--ink)",
  fontFamily: "var(--font-ui)",
  fontSize: "13.5px",
  outline: "none",
  transition: "border-color 160ms ease, box-shadow 160ms ease"
};

const selectStyle = {
  ...inputStyle,
  appearance: "none",
  cursor: "pointer",
  paddingRight: "32px"
};

function FormField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ name, value, onChange, placeholder }) {
  return (
    <input
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={e => {
        e.target.style.borderColor = "var(--amber)";
        e.target.style.boxShadow = "0 0 0 3px var(--amber-ring)";
      }}
      onBlur={e => {
        e.target.style.borderColor = "var(--border)";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

export default function FamilyForm({ value, enums, onSave, onCancel }) {
  const [form, setForm] = useState(
    value || {
      firstname: "",
      lastname: "",
      relationtype: "",
      surname: "",
      occtype: "",
      maritalsts: "",
      livingstatus: "",
      gender: "",
      cellphone: "",
      homephone: "",
      otherphone: "",
      emailaddress: "",
      placeoforigin: ""
    }
  );

  const onChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div
      style={{
        marginTop: "12px",
        padding: "18px",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-sm)",
        background: "var(--bg)"
      }}
    >
      <h4 style={{ marginBottom: "16px" }}>
        {value ? "Edit Family Member" : "Add Family Member"}
      </h4>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "14px"
        }}
      >
        {/* Relation */}
        <FormField label="Relation">
          <select
            name="relationtype"
            value={form.relationtype}
            onChange={onChange}
            style={selectStyle}
          >
            <option value="">Select relation</option>
            {enums.relationtype.options.map(o => (
              <option key={o.enumvalue} value={o.enumvalue}>
                {o.strvalue}
              </option>
            ))}
          </select>
        </FormField>

        {/* Gender */}
        <FormField label="Gender">
          <div style={{ display: "flex", gap: "16px" }}>
            {enums.gender.options.map(e => (
              <label
                key={e.enumvalue}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <input
                  type="radio"
                  name="gender"
                  value={e.enumvalue}
                  onChange={onChange}
                  checked={form.gender == e.enumvalue}
                />
                {e.strvalue}
              </label>
            ))}
          </div>
        </FormField>

        {/* Name */}
        <FormField label="First Name">
          <StyledInput
            name="firstname"
            value={form.firstname}
            onChange={onChange}
            placeholder="First name"
          />
        </FormField>

        <FormField label="Last Name">
          <StyledInput
            name="lastname"
            value={form.lastname}
            onChange={onChange}
            placeholder="Last name"
          />
        </FormField>

        <FormField label="Surname">
          <StyledInput
            name="surname"
            value={form.surname}
            onChange={onChange}
            placeholder="Surname"
          />
        </FormField>

        {/* Occupation */}
        <FormField label="Occupation Type">
          <select
            name="occtype"
            value={form.occtype}
            onChange={onChange}
            style={selectStyle}
          >
            <option value="">Select Occupation</option>
            {enums.occtype.options.map(o => (
              <option key={o.enumvalue} value={o.enumvalue}>
                {o.strvalue}
              </option>
            ))}
          </select>
        </FormField>

        {/* Status */}
        <FormField label="Marital Status">
          <select
            name="maritalsts"
            value={form.maritalsts}
            onChange={onChange}
            style={selectStyle}
          >
            <option value="">Select status</option>
            {enums.maritalsts.options.map(o => (
              <option key={o.enumvalue} value={o.enumvalue}>
                {o.strvalue}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Living Status">
          <select
            name="livingstatus"
            value={form.livingstatus}
            onChange={onChange}
            style={selectStyle}
          >
            <option value="">Select living status</option>
            {enums.livingstatus.options.map(o => (
              <option key={o.enumvalue} value={o.enumvalue}>
                {o.strvalue}
              </option>
            ))}
          </select>
        </FormField>

        {/* Contact Section */}
        <FormField label="Cell Phone">
          <StyledInput
            name="cellphone"
            value={form.cellphone}
            onChange={onChange}
            placeholder="Cell phone"
          />
        </FormField>

        <FormField label="Home Phone">
          <StyledInput
            name="homephone"
            value={form.homephone}
            onChange={onChange}
            placeholder="Home phone"
          />
        </FormField>

        <FormField label="Other Phone">
          <StyledInput
            name="otherphone"
            value={form.otherphone}
            onChange={onChange}
            placeholder="Other phone"
          />
        </FormField>

        <FormField label="Email">
          <StyledInput
            name="emailaddress"
            value={form.emailaddress}
            onChange={onChange}
            placeholder="Email"
          />
        </FormField>

        <FormField label="Place of Origin">
          <StyledInput
            name="placeoforigin"
            value={form.placeoforigin}
            onChange={onChange}
            placeholder="Place"
          />
        </FormField>
      </div>

      {/* ACTIONS */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "18px",
          borderTop: "1px solid var(--border)",
          paddingTop: "14px"
        }}
      >
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>

        <button
          onClick={() => onSave(form)}
          style={{
            padding: "10px 24px",
            borderRadius: "var(--r-sm)",
            border: "none",
            background:
              "linear-gradient(110deg, var(--amber), var(--rose-light))",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}