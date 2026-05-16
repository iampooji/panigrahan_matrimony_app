import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/apiClient";
import ActiveProfileStats from "../components/ActiveProfileStats";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin()) return;
    setLoading(true);
    api("/profiles/admin/stats")
      .then(res => { if (res.success) setStats(res.stats); })
      .catch(err => console.error("Dashboard stats error:", err))
      .finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = stats ? [
    { label: "Total Members", value: stats.total,    },
    { label: "Paid",          value: stats.paid,     },
    { label: "Expiring Soon", value: stats.expiring, },
    { label: "Expired", value: stats.expired,  },
    { label: "Unpaid",        value: stats.unpaid,   },
  ] : [];

  return (
    <div style={{ padding: "32px 24px", maxWidth: "1400px", margin: "0 auto" }}>
      <p className="large-text">Welcome!</p>
      <ActiveProfileStats />
      {isAdmin() && (
        <div style={{ marginTop: "32px" }}>
          {loading ? (
            <div style={{ display: "flex", gap: "16px" }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="dashboard-card" style={{ opacity: 0.4, flex: 1 }}>
                  <div className="card-value">—</div>
                  <div className="card-label">Loading...</div>
                </div>
              ))}
            </div>
          ) : stats && (
            <div className="dashboard">
              {STAT_CARDS.map(card => (
                <div key={card.label} className="dashboard-card">
                  <div className="card-value">{card.value}</div>
                  <div className="card-label">{card.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}