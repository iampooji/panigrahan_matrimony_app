import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/apiClient";

export default function AdminPage() {
  const { isAdmin } = useAuth();
  if (!isAdmin()) return <Navigate to="/" replace />;
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [newEmail,    setNewEmail]    = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating,    setCreating]    = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [resetId,      setResetId]      = useState(null);
  const [resetPwd,     setResetPwd]     = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetError,   setResetError]   = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api("/auth/admin/users");
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    setCreateError(""); setCreateSuccess("");
    if (!newEmail || !newPassword)
      return setCreateError("Email and password are required");
    const pwdError = validatePassword(newPassword);
    if (pwdError) return setCreateError(pwdError);
    setCreating(true);
    try {
      const res = await api("/auth/admin/users", {
        method: "POST",
        body: JSON.stringify({ email: newEmail, password: newPassword })
      });
      if (res.success) {
        setCreateSuccess("Staff user created successfully");
        setNewEmail(""); setNewPassword("");
        loadUsers();
      } else setCreateError(res.message || "Failed to create user");
    } catch (err) {
      setCreateError("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 6)             return "Password must be at least 6 characters";
    if (!/[0-9]/.test(pwd))         return "Must include at least one number";;
    return null;
  };

  const handleResetPassword = async (id) => {
    setResetError("");
    const pwdError = validatePassword(resetPwd);
    if (pwdError) return setResetError(pwdError);
    if (resetPwd !== resetConfirm)
      return setResetError("Passwords do not match");
    try {
      const res = await api(`/auth/admin/users/${id}/password`, {
        method: "PUT",
        body: JSON.stringify({ password: resetPwd })
      });
      if (res.success) { setResetId(null); setResetPwd(""); setResetConfirm(""); }
      else setResetError(res.message || "Failed to reset password");
    } catch { setResetError("Failed to reset password"); }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api(`/auth/admin/users/${id}/status`, { method: "PUT" });
      if (res.success) {
        setUsers(prev => prev.map(u =>
          u.id === id ? { ...u, status: res.status } : u
        ));
      }
    } catch { alert("Failed to update status"); }
  };

  const card = {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)", padding: "28px 32px",
    boxShadow: "var(--shadow-sm)", marginBottom: "24px"
  };

  const label = {
    fontSize: "10px", fontWeight: 700, letterSpacing: ".1em",
    textTransform: "uppercase", color: "var(--amber)",
    display: "block", marginBottom: "6px"
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: "900px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--amber)", margin: "0 0 4px" }}>
          Administration
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 6px" }}>
          Staff Management
        </h1>
        <div style={{ height: "3px", width: "48px", background: "linear-gradient(90deg, var(--amber), var(--rose-light))", borderRadius: "99px" }} />
      </div>

      {/* Create User */}
      <div style={card}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", margin: "0 0 20px" }}>Create Staff User</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={label}>Email</label>
            <input className="ps-input" type="email" placeholder="staff@example.com"
              value={newEmail} onChange={e => { setNewEmail(e.target.value); setCreateError(""); setCreateSuccess(""); }} />
          </div>
          <div>
            <label style={label}>Password</label>
            <input className="ps-input" type="password" placeholder="Min 6 characters"
              value={newPassword} onChange={e => { setNewPassword(e.target.value); setCreateError(""); setCreateSuccess(""); }} />
          </div>
        </div>
        {createError   && <p style={{ fontSize: "13px", color: "#c0392b", margin: "0 0 10px" }}>{createError}</p>}
        {createSuccess && <p style={{ fontSize: "13px", color: "#2a7a4e", margin: "0 0 10px" }}>{createSuccess}</p>}
        <button className="ps-search-btn" onClick={handleCreate} disabled={creating}>
          {creating ? "Creating..." : "Create User"}
        </button>
      </div>

      {/* Users List */}
      <div style={card}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", margin: "0 0 20px" }}>
          Staff Users
          <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--ink-3)", marginLeft: "8px" }}>
            {users.filter(u => u.role !== 99).length} user{users.filter(u => u.role !== 99).length !== 1 ? "s" : ""}
          </span>
        </p>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
            <div className="ps-spinner" />
          </div>
        ) : (
          <table className="ps-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th className="ps-th">Email</th>
                <th className="ps-th">Status</th>
                <th className="ps-th">Created On</th>
                <th className="ps-th"></th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.role !== 99).map(u => (
                <tr className="ps-tr" key={u.id}>
                  <td className="ps-td">
                    <span style={{ fontSize: "13px", color: "var(--ink-2)" }}>{u.email}</span>
                  </td>
                  <td className="ps-td">
                    <span className={`badge ${u.status === "ACTIVE" ? "badge-teal" : "badge-neutral"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="ps-td ps-td-meta">
                    {new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="ps-td">
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>

                      {/* Reset Password */}
                      {resetId === u.id ? (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <input className="ps-input" type="password" placeholder="New password"
                            value={resetPwd} onChange={e => { setResetPwd(e.target.value); setResetError(""); }}
                            style={{ width: "140px", padding: "6px 10px", fontSize: "12px" }} />
                          <input className="ps-input" type="password" placeholder="Confirm password"
                            value={resetConfirm} onChange={e => { setResetConfirm(e.target.value); setResetError(""); }}
                            style={{ width: "140px", padding: "6px 10px", fontSize: "12px" }} />
                          <button className="ps-action-btn"
                            style={{ background: "var(--amber)", color: "#fff", border: "none" }}
                            onClick={() => handleResetPassword(u.id)}>Save</button>
                          <button className="ps-action-btn"
                            onClick={() => { setResetId(null); setResetPwd(""); setResetConfirm(""); setResetError(""); }}>Cancel</button>
                          {resetError && <span style={{ fontSize: "12px", color: "#c0392b" }}>{resetError}</span>}
                        </div>
                      ) : (
                        <button className="ps-action-btn" onClick={() => { setResetId(u.id); setResetPwd(""); setResetError(""); }}>
                          Reset Password
                        </button>
                      )}

                      {/* Activate / Deactivate */}
                      <button className="ps-action-btn"
                        style={{
                          background: u.status === "ACTIVE" ? "#fff0f0" : "#f0fff4",
                          color: u.status === "ACTIVE" ? "#c0392b" : "#2a7a4e",
                          border: `1px solid ${u.status === "ACTIVE" ? "#f5c6c6" : "#a8e6c0"}`
                        }}
                        onClick={() => handleToggleStatus(u.id)}>
                        {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
              {users.filter(u => u.role !== 99).length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--ink-3)", fontSize: "13px" }}>No staff users found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}