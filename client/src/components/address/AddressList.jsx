const accentColors = {
  current: "linear-gradient(to bottom, var(--amber), var(--rose-light))",
  permanent: "linear-gradient(to bottom, #2a7a72, #3da898)",
  work: "linear-gradient(to bottom, #5d8ac4, #7aa3d4)"
};

const badgeStyles = {
  current: {
    background: "var(--amber-dim)",
    color: "var(--amber)",
    border: "1px solid rgba(200,105,42,.3)"
  },
  permanent: {
    background: "var(--teal-dim)",
    color: "var(--teal)",
    border: "1px solid rgba(42,122,114,.3)"
  },
  work: {
    background: "rgba(93,138,196,.12)",
    color: "#5d8ac4",
    border: "1px solid rgba(93,138,196,.3)"
  },
  "current-permanent": {
    background: "linear-gradient(90deg, var(--amber-dim), var(--teal-dim))",
    color: "var(--ink-2)",
    border: "1px solid var(--border)"
  }
};

const badgeIcons   = { current: "◎", permanent: "⌂", work: "⚑", "current-permanent": "◎ / ⌂" };
const badgeLabels  = { current: "Current", permanent: "Permanent", work: "Work", "current-permanent": "Current / Permanent" };

const norm = (v) => (v ?? "").toString().trim().toLowerCase();

const addressEqual = (a, b) => {
  if (!a || !b) return false;
  // Same DB row — fastest check
  if (a.id && b.id && a.id === b.id) return true;
  // Normalize each field before comparing so whitespace/null/undefined differences don't matter
  return (
    norm(a.addone)   === norm(b.addone)   &&
    norm(a.addtwo)   === norm(b.addtwo)   &&
    norm(a.city)     === norm(b.city)     &&
    norm(a.district) === norm(b.district) &&
    norm(a.state)    === norm(b.state)    &&
    norm(a.country)  === norm(b.country)  &&
    norm(a.zipcode)  === norm(b.zipcode)
  );
};

function AddressCard({ type, address, onEdit }) {
  const style  = badgeStyles[type] || badgeStyles.current;
  const accent = type === "current-permanent"
    ? "linear-gradient(to bottom, var(--amber), #2a7a72)"
    : accentColors[type] || accentColors.current;

  return (
    <div style={{
      background: "var(--bg)", border: "1px solid var(--border)",
      borderRadius: "var(--r-sm)", padding: "14px 16px",
      position: "relative", overflow: "hidden",
      transition: "border-color 160ms ease, transform 160ms ease"
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.transform = "translateX(4px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateX(0)"; }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: accent }} />
      <div style={{ paddingLeft: "8px" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "3px 10px", borderRadius: "9999px",
          fontSize: "10px", fontWeight: 700, letterSpacing: ".06em",
          textTransform: "uppercase", marginBottom: "8px", ...style
        }}>
          {badgeIcons[type]} {badgeLabels[type]}
        </span>

        <div style={{ fontSize: "13.5px", color: "var(--ink-2)", fontWeight: 500 }}>
          {address.addone}{address.addtwo ? `, ${address.addtwo}` : ""}
        </div>
        <div style={{ fontSize: "12.5px", color: "var(--ink-3)", marginTop: "4px", lineHeight: 1.6 }}>
          {[address.city, address.district, address.state, address.country, address.zipcode].filter(Boolean).join(" · ")}
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <button
            onClick={() => onEdit(type)}
            style={{ padding: "4px 14px", borderRadius: "var(--r-xs)", border: "1.5px solid var(--border)", background: "transparent", color: "var(--ink-3)", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", transition: "all 160ms ease" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.color = "var(--amber)"; e.currentTarget.style.background = "var(--amber-dim)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; }}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddressList({ addresses, onAdd, onEdit }) {
  const { current, permanent, work } = addresses;

  const isSame = addressEqual(current, permanent);

  const hasAny = current || permanent || work;

  return (
    <div className="mt-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--amber)" }}>
            Address
          </span>
          <span style={{ flex: 1, height: "1px", background: "var(--border)", display: "inline-block", width: "60px" }} />
        </div>
        <button onClick={onAdd} className="btn-secondary"
          style={{ padding: "7px 16px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span> Add Address
        </button>
      </div>

      {!hasAny && (
        <div style={{
          padding: "24px", background: "var(--bg)",
          border: "1.5px dashed var(--border-2)", borderRadius: "var(--r-md)",
          textAlign: "center", color: "var(--ink-4)", fontSize: "13px", fontStyle: "italic"
        }}>
          No addresses added yet
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {isSame ? (
          <AddressCard type="current-permanent" address={current} onEdit={onEdit} />
        ) : (
          <>
            {current   && <AddressCard type="current"   address={current}   onEdit={onEdit} />}
            {permanent && <AddressCard type="permanent" address={permanent} onEdit={onEdit} />}
          </>
        )}
        {work && <AddressCard type="work" address={work} onEdit={onEdit} />}
      </div>
    </div>
  );
}