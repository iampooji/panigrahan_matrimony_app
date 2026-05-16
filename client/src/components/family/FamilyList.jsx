import { useState } from "react";
import AddressForm from "../address/AddressForm";
import { saveAddress, saveBulkAddresses, editAddress, editMergedAddress } from "../../logic/address.logic";

const TYPE_COLORS = {
  current:            { bg: "var(--amber-dim)",               color: "var(--amber)", border: "rgba(200,105,42,.3)", icon: "◎" },
  permanent:          { bg: "var(--teal-dim)",                color: "var(--teal)",  border: "rgba(42,122,114,.3)", icon: "⌂" },
  work:               { bg: "rgba(93,138,196,.12)",           color: "#5d8ac4",      border: "rgba(93,138,196,.3)", icon: "⚑" },
  "current-permanent":{ bg: "linear-gradient(90deg, var(--amber-dim), var(--teal-dim))", color: "var(--ink-2)", border: "var(--border)", icon: "◎ / ⌂" }
};

/* ── Content-based equality — handles old data where ids differ but content is same ── */
const addressEqual = (a, b) => {
  if (!a || !b) return false;
  return (
    a.addone   === b.addone   &&
    a.addtwo   === b.addtwo   &&
    a.city     === b.city     &&
    a.district === b.district &&
    a.state    === b.state    &&
    a.country  === b.country  &&
    a.zipcode  === b.zipcode
  );
};

function AddressBadge({ type, address, onEdit }) {
  if (!address) return null;
  const c = TYPE_COLORS[type];
  const isMerged = type === "current-permanent";

  return (
    <div style={{
      padding: "10px 12px", borderRadius: "var(--r-sm)",
      background: "var(--bg)", border: "1px solid var(--border)",
      position: "relative", overflow: "hidden",
      transition: "border-color 160ms ease"
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = isMerged ? "var(--amber)" : c.color}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
        background: isMerged
          ? "linear-gradient(to bottom, var(--amber), #2a7a72)"
          : c.color
      }} />
      <div style={{ paddingLeft: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{
            fontSize: "9.5px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
            padding: "2px 8px", borderRadius: "9999px",
            background: c.bg, color: isMerged ? "var(--ink-2)" : c.color,
            border: `1px solid ${c.border}`
          }}>
            {c.icon} {isMerged ? "Current / Permanent" : type}
          </span>
          {/* Single Edit button for merged, or per-type Edit */}
          <button
            onClick={() => onEdit(type)}
            style={{
              fontSize: "11px", fontWeight: 600, color: "var(--ink-4)",
              background: "none", border: "none", cursor: "pointer",
              transition: "color 160ms ease"
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--amber)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--ink-4)"}
          >
            Edit
          </button>
        </div>
        <div style={{ fontSize: "12.5px", color: "var(--ink-2)" }}>
          {address.addone}{address.addtwo ? `, ${address.addtwo}` : ""}
        </div>
        <div style={{ fontSize: "11.5px", color: "var(--ink-4)", marginTop: "2px" }}>
          {[address.city, address.state, address.country].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}

export default function FamilyList({
  members,
  addresses,
  onAdd,
  onEdit,
  onDelete,
  onRefreshAddress
}) {
  const [editingAddress, setEditingAddress] = useState(null);

  const handleEditAddress = (memberId, type, memberAddresses) => {
    if (type === "current-permanent") {
      setEditingAddress({
        memberId,
        address_type: "current-permanent",
        current_id:   memberAddresses.current?.id,
        permanent_id: memberAddresses.permanent?.id,
        ...memberAddresses.current   // pre-fill form with current address data
      });
    } else {
      setEditingAddress({ memberId, address_type: type, ...memberAddresses[type] });
    }
  };

  const handleAddAddress = (memberId) => {
    setEditingAddress({ memberId, isNew: true });
  };

  const handleAddressSave = async (dataOrArray) => {
    const memberId = editingAddress.memberId;

    if (editingAddress.isNew) {
      // Add mode — bulk saves handles same-as-current
      const items = Array.isArray(dataOrArray) ? dataOrArray : [dataOrArray];
      await saveBulkAddresses("family", memberId, items);
    } else if (editingAddress.address_type === "current-permanent") {
      // Merged edit — single or split
      await editMergedAddress("family", memberId, dataOrArray);
    } else {
      // Single address edit
      await editAddress("family", memberId, {
        ...dataOrArray,
        id: editingAddress.id,
        address_type: editingAddress.address_type
      });
    }

    setEditingAddress(null);
    if (onRefreshAddress) await onRefreshAddress(memberId);
  };

  const handleAddressCancel = () => setEditingAddress(null);

  return (
    <div style={{ marginTop: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--amber)" }}>
            Family Members
          </span>
          <span style={{ flex: 1, height: "1px", background: "var(--border)", display: "inline-block", width: "60px" }} />
        </div>
        <button onClick={onAdd} className="btn-secondary"
          style={{ padding: "7px 16px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span> Add Family
        </button>
      </div>

      {members.length === 0 && (
        <div style={{
          padding: "24px", background: "var(--bg)",
          border: "1.5px dashed var(--border-2)", borderRadius: "var(--r-md)",
          textAlign: "center", color: "var(--ink-4)", fontSize: "13px", fontStyle: "italic"
        }}>
          No family members added yet
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {members.map(m => {
          const memberAddresses = addresses[m.id] || { current: null, permanent: null, work: null };

          // Merge if same id OR same content (handles old data)
          const isSame =
            (memberAddresses.current?.id && memberAddresses.permanent?.id &&
             memberAddresses.current.id === memberAddresses.permanent.id) ||
            addressEqual(memberAddresses.current, memberAddresses.permanent);

          const isEditingThisMember = editingAddress?.memberId === m.id;
          const isAddMode  = isEditingThisMember && editingAddress?.isNew;
          const isEditMode = isEditingThisMember && !editingAddress?.isNew;

          return (
            <div key={m.id} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--r-md)", overflow: "hidden",
              boxShadow: "var(--shadow-xs)",
              transition: "border-color 260ms ease, box-shadow 260ms ease"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}
            >
              {/* Member header */}
              <div style={{
                padding: "14px 18px", background: "var(--bg)",
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--ink)", letterSpacing: "-.01em" }}>
                    {m.firstname} {m.lastname} {m.surname}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--amber)", fontWeight: 600, marginTop: "2px" }}>
                    {m.relationLabel}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => onEdit(m)} style={{ padding: "5px 14px", borderRadius: "var(--r-xs)", border: "1.5px solid var(--border)", background: "transparent", color: "var(--ink-3)", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", transition: "all 160ms ease" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.color = "var(--amber)"; e.currentTarget.style.background = "var(--amber-dim)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; }}
                  >Edit</button>
                  <button onClick={() => onDelete(m.id)} style={{ padding: "5px 14px", borderRadius: "var(--r-xs)", border: "1.5px solid rgba(192,57,43,.3)", background: "transparent", color: "var(--danger)", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", transition: "all 160ms ease" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--danger)"; e.currentTarget.style.borderColor = "var(--danger)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(192,57,43,.3)"; e.currentTarget.style.color = "var(--danger)"; }}
                  >Delete</button>
                </div>
              </div>

              {/* Contact details */}
              <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {[
                    m.cellphone    && `📱 ${m.cellphone}`,
                    m.emailaddress && `✉ ${m.emailaddress}`,
                    m.placeoforigin&& `📍 ${m.placeoforigin}`
                  ].filter(Boolean).map((item, i) => (
                    <span key={i} style={{ fontSize: "12px", color: "var(--ink-3)", padding: "3px 10px", background: "var(--bg-2)", borderRadius: "9999px", border: "1px solid var(--border)" }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Addresses */}
              <div style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-4)" }}>
                    Addresses
                  </span>
                  {!isEditingThisMember && (
                    <button onClick={() => handleAddAddress(m.id)} style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--amber)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      + Add Address
                    </button>
                  )}
                </div>

                {!memberAddresses.current && !memberAddresses.permanent && !memberAddresses.work && !isEditingThisMember && (
                  <div style={{ fontSize: "12px", color: "var(--ink-4)", fontStyle: "italic", marginBottom: "8px" }}>
                    No address added
                  </div>
                )}

                {(memberAddresses.current || memberAddresses.permanent || memberAddresses.work) && !isAddMode && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px", marginBottom: isEditMode ? "14px" : "0" }}>
                    {isSame ? (
                      /* Merged card — one Edit button */
                      <AddressBadge
                        type="current-permanent"
                        address={memberAddresses.current}
                        onEdit={() => handleEditAddress(m.id, "current-permanent", memberAddresses)}
                      />
                    ) : (
                      <>
                        {memberAddresses.current && (
                          <AddressBadge
                            type="current"
                            address={memberAddresses.current}
                            onEdit={(type) => handleEditAddress(m.id, type, memberAddresses)}
                          />
                        )}
                        {memberAddresses.permanent && (
                          <AddressBadge
                            type="permanent"
                            address={memberAddresses.permanent}
                            onEdit={(type) => handleEditAddress(m.id, type, memberAddresses)}
                          />
                        )}
                      </>
                    )}
                    {memberAddresses.work && (
                      <AddressBadge
                        type="work"
                        address={memberAddresses.work}
                        onEdit={(type) => handleEditAddress(m.id, type, memberAddresses)}
                      />
                    )}
                  </div>
                )}

                {isEditingThisMember && (
                  <AddressForm
                    value={isEditMode ? editingAddress : null}
                    onSave={handleAddressSave}
                    onCancel={handleAddressCancel}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}