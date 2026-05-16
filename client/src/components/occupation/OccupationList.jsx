import { useEffect, useState } from "react";
import { loadFormEnums } from "../../logic/enumStore";

const accentColors = {
  occupation: "linear-gradient(to bottom, var(--amber), var(--rose-light))"
};

const labelStyle = {
  fontSize: "9.5px",
  fontWeight: 700,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: "var(--amber)",
  minWidth: "140px",
  flexShrink: 0
};

const rowStyle = {
  padding: "5px 12px",
  background: "var(--bg)",
  borderRadius: "var(--r-sm)",
  border: "1px solid var(--border)",
  fontSize: "12.5px",
  color: "var(--ink-2)",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  transition: "border-color 160ms ease, transform 160ms ease"
};

function OccRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div
      style={rowStyle}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--amber)";
        e.currentTarget.style.transform   = "translateX(4px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform   = "translateX(0)";
      }}
    >
      <span style={labelStyle}>{label}</span>
      <span style={{ color: "var(--ink-2)" }}>{value}</span>
    </div>
  );
}

export default function OccupationList({ occupations, onAdd, onEdit, onDelete }) {
  const [enums, setEnums] = useState(null);

  useEffect(() => {
    loadFormEnums("occupation").then(setEnums);
  }, []);

  const getOccType = (value) =>
    enums?.occtype?.options?.find(e => e.enumvalue == value)?.strvalue || value;

  const isEmpty = !occupations || !Array.isArray(occupations) || occupations.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          fontSize: "10.5px", fontWeight: 700, letterSpacing: ".12em",
          textTransform: "uppercase", color: "var(--amber)",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          Occupation
          <span style={{ flex: 1, height: "1px", background: "var(--border)", minWidth: "40px" }} />
        </div>
        <button
          onClick={onAdd}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--r-sm)",
            border: "1.5px solid var(--border)",
            background: "var(--bg)",
            color: "var(--ink-3)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 160ms ease",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "var(--amber)";
            e.currentTarget.style.color       = "var(--amber)";
            e.currentTarget.style.background  = "var(--amber-dim)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color       = "var(--ink-3)";
            e.currentTarget.style.background  = "var(--bg)";
          }}
        >
          + Add Occupation
        </button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div style={{
          padding: "16px",
          borderRadius: "var(--r-sm)",
          border: "1px dashed var(--border)",
          background: "var(--bg)",
          color: "var(--ink-4)",
          fontSize: "12.5px",
          textAlign: "center"
        }}>
          No occupation added yet.
        </div>
      )}

      {/* Occupation cards */}
      {!isEmpty && occupations.map(occ => (
        <div
          key={occ.id}
          style={{
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
            position: "relative",
            transition: "box-shadow 160ms ease"
          }}
        >
          {/* Left accent bar */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: "3px",
            background: accentColors.occupation
          }} />

          <div style={{ padding: "14px 16px 14px 20px" }}>
            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
              <OccRow label="Occupation Name"       value={occ.occname} />
              <OccRow label="Role"                  value={occ.occrole} />
              <OccRow label="Company"               value={occ.compname} />
              <OccRow label="Type"                  value={getOccType(occ.occtype)} />
              <OccRow label="Annual Income (Lakhs)" value={occ.income} />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => onEdit(occ)}
                style={{
                  padding: "5px 14px",
                  borderRadius: "var(--r-sm)",
                  border: "1.5px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--ink-3)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 160ms ease"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--amber)";
                  e.currentTarget.style.color       = "var(--amber)";
                  e.currentTarget.style.background  = "var(--amber-dim)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color       = "var(--ink-3)";
                  e.currentTarget.style.background  = "var(--bg)";
                }}
              >
                ✎ Edit
              </button>
              <button
                onClick={() => onDelete(occ.id)}
                style={{
                  padding: "5px 14px",
                  borderRadius: "var(--r-sm)",
                  border: "1.5px solid transparent",
                  background: "rgba(192,57,43,.07)",
                  color: "var(--danger)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 160ms ease"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background   = "rgba(192,57,43,.14)";
                  e.currentTarget.style.borderColor  = "rgba(192,57,43,.3)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background   = "rgba(192,57,43,.07)";
                  e.currentTarget.style.borderColor  = "transparent";
                }}
              >
                ✕ Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}