import { useEffect, useState } from "react";
import OccupationList from "./OccupationList";
import OccupationForm from "./OccupationForm";
import {
  getOccupation,
  addOccupation,
  updateOccupation,
  deleteOccupation,
} from "../../logic/occupation.logic";

export default function OccupationSection({ parenttype, parentid }) {
  const [occupations, setoccupations] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  // const [enums, setEnums] = useState(null);

  useEffect(() => {
    if (!parentid) return;
    load();
  }, [parenttype, parentid]);

  const load = async () => {
    const rows = await getOccupation(parenttype, parentid);
    setoccupations(rows);
  };

  const save = async (data) => {
    if (editing) {
      await updateOccupation(editing.id, data);
    } else {
      await addOccupation(parenttype, parentid, data);
    }

    setEditing(null);
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    await deleteOccupation(id);
    setoccupations(occupations.filter(occ => occ.id !== id));
  };

  return (
    <>
      <OccupationList
        occupations={occupations}
        onAdd={() => {
          setEditing(null);
          setShowForm(true);
        }}
        onEdit={(a) => {
          setEditing(a);
          setShowForm(true);
        }}
        onDelete={remove}
      />

      {showForm && (
        <OccupationForm
          value={editing}
          onSave={save}
          onCancel={() => {
            setEditing(null);
            setShowForm(false);
          }}
        />
      )}
    </>
  );
}
