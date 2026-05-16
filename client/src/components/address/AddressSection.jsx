import { useEffect, useState } from "react";
import AddressList from "./AddressList";
import AddressForm from "./AddressForm";
import { getAddresses, saveAddress, saveBulkAddresses, editAddress, editMergedAddress, syncAddressToFamily } from "../../logic/address.logic";

// ── familyids (optional array): if provided and relationtype === "profile",
//    the "Living with parents" checkbox will be shown in the form,
//    and checking it on save will copy the profile address to ALL listed family members.
export default function AddressSection({ relationtype, relationid, familyids, onDone }) {
  const [addresses, setAddresses] = useState({ current: null, permanent: null, work: null });
  const [editing, setEditing]     = useState(null);
  const [showForm, setShowForm]   = useState(false);

  // ── Resolved family IDs — mirrored into state so changes to the prop
  //    (e.g. family data loading after mount) trigger a re-render correctly.
  const [resolvedFamilyIds, setResolvedFamilyIds] = useState(familyids || []);

  // ── Family addresses — keyed by familyid, used for snapshot/restore on uncheck.
  //    We store the first parent's addresses for the form preview; all parents get synced on save.
  const [familyAddresses, setFamilyAddresses] = useState({ current: null, permanent: null, work: null });

  useEffect(() => {
    if (!relationid) return;
    load();
  }, [relationtype, relationid]);

  // ── Sync resolved IDs whenever the prop updates (family data loads later) ──
  useEffect(() => {
    setResolvedFamilyIds(familyids || []);
  }, [familyids]);

  // ── Load first parent's addresses for snapshot/restore preview ──
  useEffect(() => {
    if (!resolvedFamilyIds.length) return;
    loadFamilyAddresses(resolvedFamilyIds[0]);
  }, [resolvedFamilyIds]);

  const load = async () => {
    const result = await getAddresses(relationtype, relationid);
    setAddresses(result || { current: null, permanent: null, work: null });
  };

  const loadFamilyAddresses = async (familyid) => {
    const result = await getAddresses("family", familyid);
    setFamilyAddresses(result || { current: null, permanent: null, work: null });
  };

  const handleSave = async (dataOrArray) => {
    if (editing?.address_type === "current-permanent") {
      // Already-merged card edit
      if (Array.isArray(dataOrArray)) {
        // User unchecked "same" — split into two rows
        await editMergedAddress(relationtype, relationid, dataOrArray);
      } else {
        await editMergedAddress(relationtype, relationid, {
          ...dataOrArray,
          current_id:   editing.current_id,
          permanent_id: editing.permanent_id,
        });
      }
    } else if (editing && dataOrArray.wantMerge) {
      // Single-type edit where user checked "make both same"
      const { wantMerge, livingWithParents, ...addressData } = dataOrArray;
      await editMergedAddress(relationtype, relationid, {
        ...addressData,
        address_type: "current-permanent",
        current_id:   addresses.current?.id,
        permanent_id: addresses.permanent?.id,
      });
    } else if (editing) {
      // Normal single-type edit
      const { livingWithParents, ...cleanData } = dataOrArray;
      await editAddress(relationtype, relationid, {
        ...cleanData,
        id:           editing.id,
        address_type: editing.address_type,
      });
    } else if (Array.isArray(dataOrArray)) {
      // Bulk add
      await saveBulkAddresses(relationtype, relationid, dataOrArray);
    } else {
      await saveAddress(relationtype, relationid, dataOrArray);
    }

    // ── Living with parents: after saving profile address,
    //    copy current + permanent to ALL linked parent family members.
    const wantsSync = resolvedFamilyIds.length > 0 && (
      dataOrArray?.livingWithParents ||
      (Array.isArray(dataOrArray) && dataOrArray._livingWithParents)
    );

    if (wantsSync) {
      // Re-fetch the just-saved profile address so we copy the latest data
      const latest = await getAddresses(relationtype, relationid);
      const itemsToSync = [];
      if (latest?.current)   itemsToSync.push({ address_type: "current",   ...latest.current });
      if (latest?.permanent) itemsToSync.push({ address_type: "permanent", ...latest.permanent });

      if (itemsToSync.length) {
        // Sync to every parent in parallel
        await Promise.all(
          resolvedFamilyIds.map(fid => syncAddressToFamily(fid, itemsToSync))
        );
      }
    }

    setEditing(null);
    setShowForm(false);
    await load();
    // Refresh snapshot for first parent so restore works correctly next time
    if (resolvedFamilyIds.length) await loadFamilyAddresses(resolvedFamilyIds[0]);
    if (onDone) onDone();
  };

  const handleCancel = () => {
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (address_type) => {
    if (address_type === "current-permanent") {
      setEditing({
        address_type:  "current-permanent",
        current_id:    addresses.current?.id,
        permanent_id:  addresses.permanent?.id,
        ...addresses.current,
      });
    } else {
      const oppositeType = address_type === "current" ? "permanent" : address_type === "permanent" ? "current" : null;
      setEditing({
        address_type,
        opposite_id:  oppositeType ? addresses[oppositeType]?.id : null,
        has_opposite: oppositeType ? Boolean(addresses[oppositeType]) : false,
        ...addresses[address_type],
      });
    }
    setShowForm(true);
  };

  return (
    <>
      <AddressList
        addresses={addresses}
        onAdd={() => { setEditing(null); setShowForm(true); }}
        onEdit={handleEdit}
      />
      {showForm && (
        <AddressForm
          value={editing}
          onSave={handleSave}
          onCancel={handleCancel}
          // ── Living-with-parents feature ──
          // Only active when this is a profile section with at least one linked parent
          hasFamilyMember={relationtype === "profile" && resolvedFamilyIds.length > 0}
          familyAddresses={familyAddresses}
        />
      )}
    </>
  );
}