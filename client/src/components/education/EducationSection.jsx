import { useEffect, useState } from "react";
import EducationList from "./EducationList";
import EducationForm from "./EducationForm";
import {
  getEducation,
  addEducation,
  updateEducation,
  deleteEducation,
} from "../../logic/education.logic";

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-md)", padding: "28px 32px", minWidth: "320px",
        boxShadow: "var(--shadow-lg)", textAlign: "center"
      }}>
        <div style={{ fontSize: "20px", marginBottom: "10px" }}>🗑️</div>
        <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
          Confirm Delete
        </div>
        <div style={{ fontSize: "13px", color: "var(--ink-3)", marginBottom: "22px" }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "7px 20px", borderRadius: "var(--r-xs)", fontSize: "13px",
              fontWeight: 600, border: "1.5px solid var(--border)",
              background: "transparent", color: "var(--ink-3)", cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "7px 20px", borderRadius: "var(--r-xs)", fontSize: "13px",
              fontWeight: 600, border: "1.5px solid var(--danger)",
              background: "var(--danger)", color: "#fff", cursor: "pointer"
            }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EducationSection({ profile_id }) {
  const [educations, setEducations] = useState([]);
  const [editing, setEditing]       = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [confirmId, setConfirmId]   = useState(null);   // ← holds id pending deletion

  useEffect(() => {
    if (!profile_id) return;
    load();
  }, [profile_id]);

  const load = async () => {
    const rows = await getEducation(profile_id);
    setEducations(rows);
  };

  const save = async (data) => {
    if (editing) {
      await updateEducation(editing.id, data);
    } else {
      await addEducation(profile_id, data);
    }
    setEditing(null);
    setShowForm(false);
    load();
  };

  // open confirm dialog
  const requestDelete = (id) => setConfirmId(id);

  // confirmed, actually delete
  const confirmDelete = async () => {
    await deleteEducation(confirmId);
    setEducations(educations.filter((edu) => edu.id !== confirmId));
    setConfirmId(null);
  };

  return (
    <>
      <EducationList
        educations={educations}
        onAdd={() => { setEditing(null); setShowForm(true); }}
        onEdit={(edu) => { setEditing(edu); setShowForm(true); }}
        onDelete={requestDelete}               // ← pass requestDelete, not remove directly
      />

      {showForm && (
        <EducationForm
          value={editing}
          onSave={save}
          onCancel={() => { setEditing(null); setShowForm(false); }}
        />
      )}

      {confirmId !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this education record?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  );
}