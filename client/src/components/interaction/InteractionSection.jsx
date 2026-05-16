import { useEffect, useState } from "react";
import { loadFormEnums } from "../../logic/enumStore";
import {
  getInteractions,
  addInteraction,
  addTask,
  getTasks
} from "../../logic/interaction.logic";
import { api } from "../../api/apiClient";
import { useAuth } from "../../auth/AuthContext";

const Tooltip = ({ text, children }) => (
  <div className="relative group inline-block w-full">
    {children}
    <div className="absolute z-10 bottom-full left-0 mb-1 hidden group-hover:block
      bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
      {text}
    </div>
  </div>
);

export default function InteractionSection({
  profileid,
  clientid,
  hideList = false,
  onAdded
}) {
  const [rows, setRows] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [enums, setEnums] = useState(null);
  const [clientId, setClientId] = useState(clientid || "");
  const [profileError, setProfileError] = useState("");

  const { getCurrentStaffId } = useAuth();
  const currentStaffId = getCurrentStaffId();

  const [form, setForm] = useState({
    interactiontype: "",
    notes: "",
    task: ""
  });

  useEffect(() => {
    if (clientId) setClientId(clientId);
  }, [clientId]);

  const load = async () => {
    if (!clientId) return;
    const r = await getInteractions(clientId);
    const t = await getTasks(clientId);
    setRows(r || []);
    setTasks(t || []);
  };

  useEffect(() => {
    loadFormEnums("interaction")
      .then(setEnums)
      .catch(err => {
        console.error("Failed to load enums:", err);
        setEnums({});
      });
  }, []);

  useEffect(() => {
    if (!hideList) load();
  }, [clientId, hideList]);

  const save = async () => {
    setProfileError("");
    // if (!profileId || !form.interactiontype || !form.notes) return;

    // let profileExists = false;

    // try {
    //   const check = await api(`/profiles/${profileId}`);
    //   if (check && check.id) profileExists = true;
    // } catch {
    //   profileExists = false;
    // }

    // if (!profileExists) {
    //   setProfileError("Profile ID doesn't exist");
    //   return;
    // }

    const newInteraction = await addInteraction({
      clientid: clientId,
      interactiontype: form.interactiontype,
      notes: form.notes,
      userid: currentStaffId
    });

    if (form.task && newInteraction?.id) {
      await addTask({
        clientid: clientId,
        description: form.task,
        createdby: currentStaffId,
        interactionid: newInteraction.id
      });
    }

    setForm({ interactiontype: "", notes: "", task: "" });
    if (!hideList) load();
    if (onAdded) onAdded();
  };

  if (!enums) return <div>Loading...</div>;

  return (
    <div className="bg-white border rounded-xl p-4 space-y-4">
      <h1 className="font-medium text-lg">Add Interaction</h1>

      {!profileid && (
        <div>
          <Tooltip text="Enter the Client ID this interaction is linked to">
            <input
              className="input w-full"
              placeholder="Client ID"
              value={clientId}
              onChange={e => {
                setClientId(e.target.value);
                setProfileError("");
              }}
            />
          </Tooltip>
          {profileError && (
            <p className="text-red-500 text-xs mt-1">{profileError}</p>
          )}
        </div>
      )}

      <Tooltip text="Your Staff ID (auto-filled from your login session)">
        <input
          className="input w-full bg-gray-50 cursor-not-allowed"
          placeholder="Staff ID"
          value={currentStaffId || ""}
          readOnly
        />
      </Tooltip>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Tooltip text="Select the type of interaction">
          <select
            className="input w-full"
            value={form.interactiontype}
            onChange={e => setForm({ ...form, interactiontype: e.target.value })}
          >
            <option value="">Type</option>
            {enums?.interactiontype?.options?.map(o => (
              <option key={o.enumvalue} value={o.enumvalue}>
                {o.strvalue}
              </option>
            ))}
          </select>
        </Tooltip>

        <Tooltip text="Enter notes or details about this interaction">
          <input
            className="input w-full"
            placeholder="Notes"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />
        </Tooltip>

        <Tooltip text="Optionally create a follow-up task for this profile">
          <input
            className="input w-full"
            placeholder="Create follow-up task"
            value={form.task}
            onChange={e => setForm({ ...form, task: e.target.value })}
          />
        </Tooltip>

        <button onClick={save} className="btn btn-primary">
          Add
        </button>
      </div>

      {clientId && profileError && (
        <p className="text-red-500 text-xs">{profileError}</p>
      )}

      {!hideList && tasks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium">Tasks (Open / Completed)</h4>
          {tasks.map(t => (
            <div key={t.id} className="text-sm text-muted-foreground">
              • {t.description} ({t.status})
            </div>
          ))}
        </div>
      )}

      {!hideList && rows.length > 0 && (
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="border rounded p-2 text-sm">
              <div className="font-medium">
                {enums?.interactiontype?.map?.[r.interactiontype] || r.interactiontype}
              </div>
              <div>{r.notes}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}