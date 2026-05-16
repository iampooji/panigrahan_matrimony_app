
import { useState, useEffect } from "react";
import { loadFormEnums } from "../../logic/enumStore";



export default function OccupationForm({ value, onSave, onCancel, }) {
  const [form, setForm] = useState(
    value || {
      occname: "",
      occrole: "",
      income: "",
      compname: "",
      occtype: "",
      // parenttype: "",
    }
  );
  

const [enums, setEnums] = useState(null);
useEffect(() => {
  async function fetchEnums() {
    const data = await loadFormEnums("occupation");
    setEnums(data);
  }

  fetchEnums();
}, []);

  const onChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="mt-4 border rounded bg-muted p-4">
      <h4 className="font-medium mb-3">
        {value ? "Edit Occupation" : "Add Occupation"}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input name="occname" value={form.occname} onChange={onChange} placeholder="Occupation Name" />
        <input name="occrole" value={form.occrole} onChange={onChange} placeholder="Role" />
        <input name="income" value={form.income} onChange={onChange} placeholder="Annual Income In Lakhs" />
        <input name="compname" value={form.compname} onChange={onChange} placeholder="Company Name" />
        {/* <input name="parenttype" value={form.parenttype} onChange={onChange} placeholder="Parent Type" /> */}
        <select name="occtype" value={form.occtype || ""} onChange={onChange} className="occtype" >
          <option value="">Select occupation type</option>

           {enums?.occtype?.options.map(e => (
            <option key={e.enumvalue} value={e.enumvalue}>
              {e.strvalue}
            </option>
            ))}
        </select>
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
