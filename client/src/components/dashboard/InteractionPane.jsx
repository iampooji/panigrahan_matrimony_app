import { useState, useEffect } from "react";
import { searchInteractions } from "../../logic/interaction.search.logic";
import InteractionSection from "../../components/interaction/InteractionSection";
import { api } from "../../api/apiClient";
import { useAuth } from "../../auth/AuthContext";

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    timeZone: "Asia/Kolkata"
  });
};

const toDateInputString = (date) => date.toISOString().split("T")[0];

const getLast7DaysRange = () => {
  const now = new Date();

  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  const from = new Date(now);
  from.setDate(now.getDate() - 6);
  from.setHours(0, 0, 0, 0);

  return {
    from: toDateInputString(from),
    to:   toDateInputString(to)
  };
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
            Are you sure you want to delete this interaction?
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
            <li>This interaction will be <strong>archived</strong>.</li>
            <li>You can contact your <strong>administrator</strong> to restore it if needed.</li>
          </ul>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded border text-sm text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default function InteractionPane({ profileid, clientid: clientidProp }) {
  const [filters, setFilters] = useState(() => getLast7DaysRange());
  const [rows, setRows] = useState([]);
  const [dirtyDates, setDirtyDates] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [profileIdError, setProfileIdError] = useState("");
  const [clientId, setClientId] = useState(clientidProp || "");

  const { getCurrentStaffId } = useAuth();
  const currentStaffId = getCurrentStaffId();

  // const validateProfileId = async (pid) => {
  //   if (!pid) return true;
  //   try {
  //     const profile = await api(`/profiles/${pid}`);
  //     if (!profile || !profile.id) {
  //       setProfileIdError(`Profile ID ${pid} does not exist.`);
  //       return false;
  //     }
  //     setProfileIdError("");
  //     return true;
  //   } catch {
  //     setProfileIdError(`Profile ID ${pid} does not exist.`);
  //     return false;
  //   }
  // };

  const runSearch = async (params) => {
    const r = await searchInteractions(params);
    setRows(r || []);
    setDirtyDates({});
  };

  useEffect(() => {
    const base = getLast7DaysRange();

    // On a profile page — clientidProp is the URL client_id, synchronously available from AppLayout.
    // No fallback fetch or async wait needed here.
    if (profileid && !clientidProp) return;

    if (clientidProp) {
      setClientId(clientidProp);
      const merged = { ...base, profileid: clientidProp };
      setFilters(merged);
      runSearch(merged);
      return;
    }

   // Global view — not on a profile page
    const merged = { ...base };
    setFilters(merged);
    runSearch(merged);
  }, [profileid, clientidProp]);

  const handleSearch = async () => {
    const pid = filters.profileid;
    // const valid = await validateProfileId(pid);
    // if (!valid) return;
    runSearch(filters);
  };

  const saveDateUpdate = async (interactionId) => {
    const newDate = dirtyDates[interactionId];
    if (!newDate) return;

    await api(`/interactions/${interactionId}/update`, {
      method: "PATCH",
      body: JSON.stringify({ createdat: newDate })
    });

    setRows(prev =>
      prev.map(r =>
        r.id === interactionId
          ? { ...r, createdat: newDate, created_at: newDate }
          : r
      )
    );

    setDirtyDates(prev => {
      const copy = { ...prev };
      delete copy[interactionId];
      return copy;
    });
  };

  const handleDeleteConfirmed = async () => {
    const interaction = deleteConfirm;
    setDeleteConfirm(null);
    if (!interaction) return;

    await api(`/interactions/${interaction.id}/soft-delete`, {
      method: "PATCH"
    });

    setRows(prev => prev.filter(r => r.id !== interaction.id));
  };

  return (
    /* No overflow here — the parent right-panel-content handles scrolling */
    <div className="bg-white border rounded-xl p-4 space-y-4">

      {deleteConfirm && (
        <ConfirmDeleteDialog
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <InteractionSection
        profileid={profileid}
        clientid={clientId}
        hideList
        onAdded={() => runSearch(filters)}
      />

      <div className="grid grid-cols-4 gap-2">
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

        {!clientId && (
          <Tooltip text="Filter interactions by Client ID">
            <div className="w-full space-y-1">
              <input
                className={`w-full ${profileIdError ? "border-red-400 focus:ring-red-300" : ""}`}
                placeholder="Client ID"
                defaultValue={clientId || ""}
                onChange={e => {
                  setProfileIdError("");
                  setFilters({ ...filters, profileid: e.target.value });
                }}
              />
              {profileIdError && (
                <div className="text-xs text-red-500 font-medium px-1">
                  ⚠ {profileIdError}
                </div>
              )}
            </div>
          </Tooltip>
        )}

        <Tooltip text="Filter interactions by Staff ID">
          <input
            className="w-full"
            placeholder="Staff ID"
            defaultValue={currentStaffId || ""}
            onChange={e => setFilters({ ...filters, staffid: e.target.value })}
          />
        </Tooltip>
      </div>

      <button onClick={handleSearch} className="btn btn-primary">
        Search
      </button>

      {/* ── List — no inner scroll; panel's right-panel-content scrolls ── */}
      <div className="space-y-3">
        {rows.map(r => {
          const baseDate = r.createdat ?? r.created_at;
          const dirty = dirtyDates[r.id];
          const canEdit = currentStaffId && Number(r.userid) === Number(currentStaffId);

          const hasLinkedTask = r.tasks && r.tasks.some(t => t.interactionid === r.id);
          const canDelete = canEdit && !hasLinkedTask;

          return (
            <div key={r.id} className="border rounded p-3 text-sm space-y-2">
              <div
                className="font-medium text-blue-600 cursor-pointer"
                onClick={() => window.open(`/profiles/${r.profileid}`, "_blank")}
              >
                {r.profile?.firstname} {r.profile?.lastname} ({r.profile?.client_id})
              </div>

              <div>{r.notes}</div>

              <div className="text-xs text-gray-400">
                Created by Staff ID: {r.userid}
                {canEdit
                  ? <span className="ml-2 text-green-600 font-medium">(You)</span>
                  : <span className="ml-2 text-orange-500 font-medium">(Read-only)</span>
                }
              </div>

              {baseDate && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Created On: {formatDisplayDate(baseDate)}</span>

                  {canEdit && (
                    <>
                      <input
                        type="date"
                        value={(dirty || baseDate).slice(0, 10)}
                        onChange={e =>
                          setDirtyDates(prev => ({ ...prev, [r.id]: e.target.value }))
                        }
                        className="border rounded px-1"
                      />
                      {dirty && (
                        <button
                          onClick={() => saveDateUpdate(r.id)}
                          className="px-2 py-0.5 bg-gray-600 text-white rounded"
                        >
                          Save
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {canDelete && (
                <button
                  onClick={() => setDeleteConfirm(r)}
                  className="mt-1 px-3 py-1 bg-red-100 text-red-700 border border-red-300
                    rounded text-xs hover:bg-red-200 transition"
                >
                  🗑 Delete Interaction
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}