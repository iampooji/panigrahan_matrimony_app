import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { searchTasks } from "../../logic/interaction.search.logic";
import { addTask } from "../../logic/interaction.logic";
import { api } from "../../api/apiClient";
import { useAuth } from "../../auth/AuthContext";

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d)) return "N/A";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const toDateInputString = (date) => date.toISOString().split("T")[0];

const getLast7DaysRange = () => {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setDate(now.getDate() - 6);
  from.setHours(0, 0, 0, 0);
  return { from: toDateInputString(from), to: toDateInputString(to) };
};

const Tooltip = ({ text, children }) => (
  <div className="relative group inline-block w-full">
    {children}
    <div className="absolute z-10 bottom-full left-0 mb-1 hidden group-hover:block
      bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
      {text}
    </div>
  </div>
);

const ConfirmDeleteDialog = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="font-semibold text-gray-800 text-base">
            Are you sure you want to delete this task?
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
            <li>This will also <strong>archive all related interactions</strong> linked to this task.</li>
            <li>You can contact your <strong>administrator</strong> to restore them if needed.</li>
          </ul>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="px-4 py-1.5 rounded border text-sm text-gray-700 hover:bg-gray-100">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-4 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700">
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   ADD TASK SECTION
───────────────────────────────────────────────────────────── */
function AddTaskSection({ profileid, onAdded }) {
  const { getCurrentStaffId } = useAuth();
  const currentStaffId = getCurrentStaffId();

  const [profileId,    setProfileId]    = useState(profileid || "");
  const [profileError, setProfileError] = useState("");
  const [form,         setForm]         = useState({ description: "", duedate: "" });
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    if (profileid) setProfileId(profileid);
  }, [profileid]);

  const validateAndSave = async () => {
    setProfileError("");
    if (!profileId) { setProfileError("Client ID is required."); return; }
    if (!form.description.trim()) return;

    // try {
    //   const check = await api(`/profiles/by-client-id/${profileId}`);
    //   if (!check?.id) { setProfileError("Client ID doesn't exist."); return; }
    // } catch {
    //   setProfileError("Client ID doesn't exist.");
    //   return;
    // }

    setSaving(true);
    try {
      await addTask({
        clientid:    profileId,
        description: form.description.trim(),
        createdby:   currentStaffId,
        ...(form.duedate ? { duedate: form.duedate } : {})
      });
      setForm({ description: "", duedate: "" });
      if (onAdded) onAdded();
    } catch (err) {
      setProfileError(err?.message || "Client ID doesn't exist.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <h1 className="font-medium text-lg">Add Task</h1>

      {!profileid && (
        <div>
          <Tooltip text="Enter the Client ID this task is linked to">
            <input
              className={`input w-full ${profileError ? "border-red-400" : ""}`}
              placeholder="Client ID"
              value={profileId}
              onChange={e => { setProfileId(e.target.value); setProfileError(""); }}
            />
          </Tooltip>
          {profileError && <p className="text-red-500 text-xs mt-1">{profileError}</p>}
        </div>
      )}

      {profileid && profileError && (
        <p className="text-red-500 text-xs">{profileError}</p>
      )}

      <Tooltip text="Your Staff ID (auto-filled from your login session)">
        <input
          className="input w-full bg-gray-50 cursor-not-allowed"
          placeholder="Staff ID"
          value={currentStaffId || ""}
          readOnly
        />
      </Tooltip>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Tooltip text="Describe the task">
          <input
            className="input w-full"
            placeholder="Task description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </Tooltip>

        <Tooltip text="Due date">
          <input
            type="date"
            className="input w-full"
            value={form.duedate}
            onChange={e => setForm({ ...form, duedate: e.target.value })}
          />
        </Tooltip>

        <button onClick={validateAndSave} disabled={saving} className="btn btn-primary">
          {saving ? "Adding…" : "Add"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN TASK PANE
───────────────────────────────────────────────────────────── */
export default function TaskPane({ profileid: profileidProp, clientid: clientidProp }) {
  const { id: profileIdFromRoute } = useParams();
  const [searchParams] = useSearchParams();
  const focusedTaskId = searchParams.get("taskId");

  const profileid = profileidProp || profileIdFromRoute;
  const [clientId, setClientId] = useState(clientidProp || "");

  const [filters,        setFilters]        = useState(() => ({ ...getLast7DaysRange(), notes: "" }));
  const [status,         setStatus]         = useState([]);
  const [rows,           setRows]           = useState([]);
  const [dirtyDueDates,  setDirtyDueDates]  = useState({});
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);
  const [searchError,   setSearchError]   = useState("");

  const { getCurrentStaffId } = useAuth();
  const currentStaffId = getCurrentStaffId();

  const toggleStatusFilter = (s) =>
    setStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  // const validateProfileId = async (pid) => {
  //   if (!pid) return true;
  //   try {
      
  //     const profile = await api(`/profiles/by-client-id/${pid}`);
  //     if (!profile || !profile.id) {
  //       setProfileIdError(`Client ID ${pid} does not exist.`);
  //       return false;
  //     }
  //     setProfileIdError("");
  //     return true;
  //   } catch {
  //     setProfileIdError(`Client ID ${pid} does not exist.`);
  //     return false;
  //   }
  // };

  const runSearch = async (override = {}) => {
    setSearchError("");
    const merged = {
      ...filters,
      ...override,
      status: status.join(","),
      ...(focusedTaskId ? { id: focusedTaskId } : {})
    };

    // Strip blank values so they don't reach the backend as empty strings
    const clean = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== "" && v !== null && v !== undefined)
    );

    try {
      const r = await searchTasks(clean);
      setRows(r || []);
      setDirtyDueDates({});
    } catch (err) {
      //  Backend throws if client_id not found I
      setSearchError(err?.message || "No profile found for that Client ID.");
      setRows([]);
    }
  };

  const handleSearch = async () => runSearch();

  useEffect(() => {
  const base = getLast7DaysRange();

  if (!profileid) {
    // Global view — not on a profile page
    setClientId("");
    const merged = { ...base, notes: "" };
    setFilters(merged);
    runSearch({ ...merged, ...(focusedTaskId ? { id: focusedTaskId } : {}) });
    return;
  }

  // On a profile page — clientidProp is the URL client_id, available synchronously from AppLayout.
  // No fallback fetch needed here.
  if (!clientidProp) return;

  setClientId(clientidProp);
  const merged = { ...base, notes: "", profileid: clientidProp };
  setFilters(merged);
  runSearch({ ...merged, ...(focusedTaskId ? { id: focusedTaskId } : {}) });
}, [profileid, clientidProp, status, focusedTaskId]);

  const saveTaskUpdate = async (taskId) => {
    const newDate = dirtyDueDates[taskId];
    if (!newDate) return;
    await api(`/interactions/tasks/${taskId}/update`, {
      method: "POST",
      body: JSON.stringify({ duedate: newDate })
    });
    setRows(prev => prev.map(t => t.id === taskId ? { ...t, duedate: newDate } : t));
    setDirtyDueDates(prev => { const c = { ...prev }; delete c[taskId]; return c; });
  };

  const updateStatus = async (task, payload) => {
    await api(`/interactions/tasks/${task.id}/update`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setRows(prev => prev.map(t => t.id === task.id ? { ...t, ...payload } : t));
  };

  const handleDeleteConfirmed = async () => {
    const task = deleteConfirm;
    setDeleteConfirm(null);
    if (!task) return;
    await api(`/interactions/tasks/${task.id}/soft-delete`, { method: "PATCH" });
    setRows(prev => prev.filter(t => t.id !== task.id));
  };

  return (
    <div className="space-y-4">

      {deleteConfirm && (
        <ConfirmDeleteDialog
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {(clientId || !profileidProp) && (
        <AddTaskSection profileid={clientId} onAdded={() => runSearch()} />
      )}

      {!focusedTaskId && (
        <div className="bg-white border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.from}
              onChange={e => setFilters({ ...filters, from: e.target.value })}
              title="From Date"
            />
            <input
              type="date"
              value={filters.to}
              onChange={e => setFilters({ ...filters, to: e.target.value })}
              title="To Date"
            />

            <div className="col-span-2">
              <Tooltip text="Search tasks by note content">
                <input
                  className="w-full"
                  placeholder="Search notes…"
                  value={filters.notes || ""}
                  onChange={e => setFilters({ ...filters, notes: e.target.value })}
                />
              </Tooltip>
            </div>

            {!profileid && (
              <div className="col-span-2">
                <Tooltip text="Filter tasks by Client ID">
                  <div className="w-full space-y-1">
                    <input
                      className={`w-full ${searchError ? "border-red-400 focus:ring-red-300" : ""}`}
                      placeholder="Client ID"
                      onChange={e => {
                        setSearchError(""); // ✅ was setProfileIdError
                        setFilters({ ...filters, profileid: e.target.value });
                      }}
                    />
                    {searchError && (
                      <div className="text-xs text-red-500 font-medium px-1">⚠ {searchError}</div>
                    )}
                  </div>
                </Tooltip>
              </div>
            )}
          </div>

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={status.includes(1)} onChange={() => toggleStatusFilter(1)} />
              Open
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={status.includes(3)} onChange={() => toggleStatusFilter(3)} />
              Completed
            </label>
          </div>

          <button onClick={handleSearch} className="btn btn-primary">Search</button>
        </div>
      )}

      <div className="space-y-3">
        {rows.map(t => {
          const isOpen      = t.status === 1;
          const isCompleted = t.status === 3;
          const dirtyDate   = dirtyDueDates[t.id];
          const baseDate    = t.duedate || t.createdat;
          const canEdit     = currentStaffId && Number(t.createdby) === Number(currentStaffId);

          return (
            <div key={t.id} className="bg-white border rounded-xl p-3 text-sm space-y-2">
              <div
                className="text-blue-600 cursor-pointer font-medium"
                onClick={() => window.open(`/profiles/${t.profileid}`, "_blank")}
              >
                {t.profile?.firstname} {t.profile?.lastname} ({t.profile?.client_id})
              </div>

              <div>{t.description}</div>

              <div className="text-xs text-gray-400">
                Created by Staff ID: {t.createdby}
                {canEdit
                  ? <span className="ml-2 text-green-600 font-medium">(You)</span>
                  : <span className="ml-2 text-orange-500 font-medium">(Read-only)</span>
                }
              </div>

              {canEdit && (
                <div className="flex text-xs">
                  <Tooltip text="Mark this task as Open / In Progress">
                    <button
                      onClick={() => updateStatus(t, { status: 1 })}
                      className={`px-3 py-1 rounded-l border w-full ${isOpen ? "bg-green-500 text-white" : "bg-gray-100"}`}
                    >
                      Open
                    </button>
                  </Tooltip>
                  <Tooltip text="Mark this task as Completed and enter a reason">
                    <button
                      onClick={() => {
                        const reason = prompt("Completion reason:");
                        if (!reason) return;
                        updateStatus(t, { status: 3, reason });
                      }}
                      className={`px-3 py-1 rounded-r border w-full ${!isOpen ? "bg-red-500 text-white" : "bg-gray-100"}`}
                    >
                      Completed
                    </button>
                  </Tooltip>
                </div>
              )}

              {!canEdit && (
                <div className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium
                  ${isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {isOpen ? "Open" : "Completed"}
                </div>
              )}

              {isCompleted && t.reason && (
                <div className="text-xs text-gray-600 bg-gray-50 border rounded p-2">
                  <span className="font-medium">Reason:</span> {t.reason}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Due date: {formatDisplayDate(baseDate)}</span>
                {canEdit && (
                  <>
                    <input
                      type="date"
                      value={(dirtyDate || baseDate || "").slice(0, 10)}
                      onChange={e => setDirtyDueDates(prev => ({ ...prev, [t.id]: e.target.value }))}
                      className="border rounded px-1"
                    />
                    {dirtyDate && (
                      <button
                        onClick={() => saveTaskUpdate(t.id)}
                        className="px-2 py-0.5 bg-gray-600 text-white rounded"
                      >
                        Save
                      </button>
                    )}
                  </>
                )}
              </div>

              {isCompleted && canEdit && (
                <button
                  onClick={() => setDeleteConfirm(t)}
                  className="mt-1 px-3 py-1 bg-red-100 text-red-700 border border-red-300
                    rounded text-xs hover:bg-red-200 transition"
                >
                  🗑 Delete Task
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}