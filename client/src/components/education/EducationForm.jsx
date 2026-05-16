import { useState, useEffect } from "react";
import { loadFormEnums } from "../../logic/enumStore";

export default function EducationForm({ value, onSave, onCancel }) {
  const [form, setForm] = useState(
    value || {
      degree: "",
      college: "",
      fieldstudy: "",
      year: "",
      // sort_order: ""
    }
  );

  const [enums, setEnums] = useState(null);

  useEffect(() => {
    async function fetchEnums() {
      const data = await loadFormEnums("education");
      setEnums(data);
    }
    fetchEnums();
  }, []);

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="mt-4 border rounded bg-muted p-4">
      <h4 className="font-medium mb-3">
        {value ? "Edit Education" : "Add Education"}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          name="degree"
          value={form.degree}
          onChange={onChange}
          placeholder="Qualification (e.g. PUC, B.Tech, MBBS, MBA)"
        />

        <input
          name="college"
          value={form.college}
          onChange={onChange}
          placeholder="College"
        />

        <input
          name="fieldstudy"
          value={form.fieldstudy}
          onChange={onChange}
          placeholder="Field of Study"
        />

        <input
          name="year"
          value={form.year}
          onChange={onChange}
          placeholder="Year"
        />

        {/* <input
          name="sort_order"
          value={form.sort_order}
          onChange={onChange}
          placeholder="Sort Order"
        /> */}

        {/*  later add enums for degree types */}
        {/* 
        <select name="degree_type" value={form.degree_type || ""} onChange={onChange}>
          <option value="">Select Degree Type</option>
          {enums?.degree_type?.options.map(e => (
            <option key={e.enumvalue} value={e.enumvalue}>
              {e.strvalue}
            </option>
          ))}
        </select>
        */}
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={() => onSave(form)} className="btn-primary">
          Save
        </button>
      </div>
    </div>
  );
}