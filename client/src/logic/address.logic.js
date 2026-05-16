import { api } from "../api/apiClient";

/* ── Get addresses for a profile or family member ── */
export const getAddresses = (relationtype, relationid) =>
  api(`/addresses/${relationtype}/${relationid}`);

/* ── Save single address ── */
export const saveAddress = (relationtype, relationid, data) =>
  api(`/addresses/${relationtype}/${relationid}`, {
    method: "POST",
    body: JSON.stringify(data)
  });

/* ── Save bulk addresses (handles same-as-current sharing one row) ── */
export const saveBulkAddresses = (relationtype, relationid, items) =>
  api(`/addresses/${relationtype}/${relationid}/bulk`, {
    method: "POST",
    body: JSON.stringify(items)
  });

/* ── Edit address — creates new row, relinks FK ── */
export const editAddress = (relationtype, relationid, data) =>
  api(`/addresses/${relationtype}/${relationid}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

/* ── Edit merged current+permanent address ──
   Sends to /merged endpoint which handles both FKs in one call.
   data can be a single object (still same) or array (now split).
── */
export const editMergedAddress = (relationtype, relationid, data) =>
  api(`/addresses/${relationtype}/${relationid}/merged`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const deleteAddress = (id) =>
  api(`/addresses/${id}`, { method: "DELETE" });

/* ── Sync profile address to a family member (living with parents) ──
   Copies the given address items to the family member's address rows.
   Reuses saveBulkAddresses with relationtype "family".
   Called from AddressSection after a profile address save when the
   "Living with parents" checkbox is checked.
── */
export const syncAddressToFamily = (familyid, items) =>
  saveBulkAddresses("family", familyid, items);