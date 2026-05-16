import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import InteractionPane from "../components/dashboard/InteractionPane";
import TaskPane from "../components/dashboard/TaskPane";
import "../styles.css";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin } = useAuth();

  const [showInteractions, setShowInteractions] = useState(false);
  const [showTasks,        setShowTasks]        = useState(false);
  const [interactionWidth, setInteractionWidth] = useState(780);
  const [taskWidth,        setTaskWidth]        = useState(780);

  const [iconVisible,       setIconVisible]       = useState(false);
  const [isUnlocked,        setIsUnlocked]        = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSecretBox,     setShowSecretBox]     = useState(false);
  const [boxMinimized,      setBoxMinimized]      = useState(false);
  const [secretNotes,       setSecretNotes]       = useState([]);
  const [secretNewNote,     setSecretNewNote]     = useState("");
  const [secretLoading,     setSecretLoading]     = useState(false);
  const [secretSaving,      setSecretSaving]      = useState(false);
  const [secretError,       setSecretError]       = useState("");
  const [pwdError,          setPwdError]          = useState("");
  const [pwdLoading,        setPwdLoading]        = useState(false);
  const [pwdValue,          setPwdValue]          = useState("");

  // Floating box position & size
  const [boxPos,  setBoxPos]  = useState({ x: window.innerWidth - 420, y: window.innerHeight - 560 });
  const [boxSize, setBoxSize] = useState({ w: 380, h: 480 });
  const boxDragging    = useRef(false);
  const boxResizing    = useRef(false);
  const boxDragOffset  = useRef({ x: 0, y: 0 });
  const boxResizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const logoClickCount = useRef(0);
  const logoClickTimer = useRef(null);

  const secretProfileMatch = location.pathname.match(/^\/profiles\/(\d+)/);
  const secretProfileId    = secretProfileMatch ? secretProfileMatch[1] : null;

  // Panel resize refs
  const resizing              = useRef(null);
  const resizeStartX          = useRef(0);
  const resizeStartWidth      = useRef(0);
  const interactionWidthRef   = useRef(interactionWidth);
  const taskWidthRef          = useRef(taskWidth);
  const wasDraggingRef        = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => { interactionWidthRef.current = interactionWidth; }, [interactionWidth]);
  useEffect(() => { taskWidthRef.current        = taskWidth;        }, [taskWidth]);

  const handleLogout = () => { logout(); navigate("/login"); setIsUnlocked(false); };

  const handleLogoClick = () => {
    if (!secretProfileId) return; // only works on profile pages
    logoClickCount.current += 1;
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
    logoClickTimer.current = setTimeout(() => { logoClickCount.current = 0; }, 600);
    if (logoClickCount.current >= 3) {
      logoClickCount.current = 0;
      clearTimeout(logoClickTimer.current);
      setIconVisible(true);
    }
  };

  const handleLockIconClick = () => {
    // Only works on profile pages
    if (!secretProfileId) return;
    if (isUnlocked) {
      setIsUnlocked(false);
      setShowSecretBox(false);
      // Non-admins lose the icon when they lock; admins keep it
      setIconVisible(false);
      setSecretNotes([]);
    } else {
      setPwdValue(""); setPwdError("");
      setShowPasswordModal(true);
    }
  };

  const handleSecretUnlock = async () => {
    if (!pwdValue) return setPwdError("Please enter your password");
    setPwdLoading(true); setPwdError("");
    try {
      const { api } = await import("../api/apiClient");
      const res = await api("/auth/secret/verify", {
        method: "POST", body: JSON.stringify({ password: pwdValue })
      });
      if (res?.success) {
        setIsUnlocked(true); setShowPasswordModal(false); setPwdValue("");
        setBoxMinimized(false);
        if (secretProfileId) loadSecretNotes(secretProfileId);
        setShowSecretBox(true);
      } else setPwdError(res?.message || "Incorrect password");
    } catch (err) {
      setPwdError(err.message || "Incorrect password");
    } finally { setPwdLoading(false); }
  };

  const loadSecretNotes = async (profileid) => {
    setSecretLoading(true); setSecretError("");
    try {
      const { api } = await import("../api/apiClient");
      const res = await api(`/profiles/${profileid}/secret/notes`);
      if (res?.success) setSecretNotes(res.notes || []);
    } catch { setSecretError("Failed to load notes"); }
    finally { setSecretLoading(false); }
  };


  const handleAddSecretNote = async () => {
    if (!secretNewNote.trim()) return;
    setSecretSaving(true); setSecretError("");
    try {
      const { api } = await import("../api/apiClient");
      if (secretProfileId) {
        const res = await api(`/profiles/${secretProfileId}/secret/notes`, {
          method: "POST", body: JSON.stringify({ note: secretNewNote.trim() })
        });
        if (res?.success) { setSecretNewNote(""); setSecretNotes(res.notes); }
        else setSecretError(res?.message || "Failed to save note");
      }
    } catch { setSecretError("Failed to save note"); }
    finally { setSecretSaving(false); }
  };

  const handleHideNote = async (noteId) => {
    try {
      const { api } = await import("../api/apiClient");
      await api(`/profiles/secret/notes/${noteId}`, { method: "DELETE" });
      loadSecretNotes(secretProfileId);
    } catch { setSecretError("Failed to remove note"); }
  };

  useEffect(() => {
    // Full reset when navigating away from a profile page
    if (!secretProfileId) {
      setShowSecretBox(false);
      setIsUnlocked(false);
      setIconVisible(false);
      setSecretNotes([]);
      setSecretError("");
      return;
    }
    if (!isUnlocked || !showSecretBox) return;
    setSecretNotes([]);
    setSecretError("");
    loadSecretNotes(secretProfileId);
  }, [location.pathname]);

  // ── Secret box drag / resize ──────────────────────────────────────────────
  const onBoxDragStart = (e) => {
    if (boxMinimized) return;
    boxDragging.current = true;
    boxDragOffset.current = { x: e.clientX - boxPos.x, y: e.clientY - boxPos.y };
    e.preventDefault();
  };

  const onBoxResizeStart = (e) => {
    boxResizing.current = true;
    boxResizeStart.current = { x: e.clientX, y: e.clientY, w: boxSize.w, h: boxSize.h };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const onMove = (e) => {
      if (boxDragging.current) {
        setBoxPos({
          x: Math.max(0, Math.min(window.innerWidth  - boxSize.w, e.clientX - boxDragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 60,        e.clientY - boxDragOffset.current.y))
        });
      }
      if (boxResizing.current) {
        const dx = e.clientX - boxResizeStart.current.x;
        const dy = e.clientY - boxResizeStart.current.y;
        setBoxSize({
          w: Math.max(280, Math.min(640, boxResizeStart.current.w + dx)),
          h: Math.max(300, Math.min(700, boxResizeStart.current.h + dy))
        });
      }
    };
    const onUp = () => { boxDragging.current = false; boxResizing.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [boxSize]);

  // ── Panel resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!resizing.current) return;
      const dx   = e.clientX - resizeStartX.current;
      const newW = Math.min(640, Math.max(280, resizeStartWidth.current - dx));
      if (resizing.current === "interactions") setInteractionWidth(newW);
      if (resizing.current === "tasks")        setTaskWidth(newW);
    };
    const stopResize = () => {
      if (resizing.current) {
        resizing.current = null;
        setIsDragging(false);
        document.body.style.cursor     = "";
        document.body.style.userSelect = "";
        wasDraggingRef.current = true;
        setTimeout(() => { wasDraggingRef.current = false; }, 0);
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   stopResize);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   stopResize);
    };
  }, []);

  const startResize = (panel, e) => {
    resizing.current         = panel;
    resizeStartX.current     = e.clientX;
    resizeStartWidth.current = panel === "interactions"
      ? interactionWidthRef.current
      : taskWidthRef.current;
    setIsDragging(true);
    document.body.style.cursor     = "col-resize";
    document.body.style.userSelect = "none";
  };

  // ── Nav panel toggle handlers ─────────────────────────────────────────────
  const handleToggleInteractions = () => {
    setShowInteractions(v => { const next = !v; if (next) setShowTasks(false); return next; });
  };

  const handleToggleTasks = () => {
    setShowTasks(v => { const next = !v; if (next) setShowInteractions(false); return next; });
  };

  const handleMainContentClick = () => {
    if (wasDraggingRef.current) return;
    if (showInteractions || showTasks) {
      setShowInteractions(false);
      setShowTasks(false);
    }
  };

  useEffect(() => {
    setShowInteractions(false);
    setShowTasks(false);
  }, [location.pathname]);

  const profileMatch = location.pathname.match(/^\/profiles\/(\d+)/);
  const profileId    = profileMatch ? profileMatch[1] : null;

  const [panelClientId, setPanelClientId] = useState(null);

  useEffect(() => {
    if (!profileId) { setPanelClientId(null); return; }

    // profileId from the URL is the numeric DB id (e.g. 16).
    // Fetch once to get the human-facing client_id (e.g. "19016") for display
    // and to pass to TaskPane / InteractionPane. This is the only profile API
    // call — the panes must NOT make their own fetch.
    import("../api/apiClient").then(({ api }) => {
      api(`/profiles/${profileId}`)
        .then(profile => setPanelClientId(profile?.client_id ?? null))
        .catch(() => setPanelClientId(null));
    });
  }, [profileId]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const totalPanelWidth =
    (showInteractions ? interactionWidth : 0) +
    (showTasks ? taskWidth : 0);

  return (
    <div className="app-root">

      {/* ══════════ TOP NAV ══════════ */}
      <div className="top-nav">
        <div className="top-nav-left">
          <span
            className="brand"
            onClick={handleLogoClick}
            style={{ cursor: "default", userSelect: "none" }}
          >
            Panigrahan
          </span>

          <Link to="/" className={`top-nav-link ${isActive("/") ? "active" : ""}`}>Dashboard</Link>
          <Link to="/profiles" className={`top-nav-link ${isActive("/profiles") ? "active" : ""}`}>Profiles</Link>
          <button className={`top-nav-link ${showInteractions ? "active" : ""}`} onClick={handleToggleInteractions}>Interactions</button>
          <button className={`top-nav-link ${showTasks ? "active" : ""}`} onClick={handleToggleTasks}>Tasks</button>

          {isAdmin() && (
            <Link to="/admin" className={`top-nav-link ${isActive("/admin") ? "active" : ""}`}>Admin</Link>
          )}
        </div>

        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="app-body">
        <div
          className="main-content"
          style={{
            marginRight: totalPanelWidth,
            pointerEvents: isDragging ? "none" : "auto",
            transition: isDragging ? "none" : "margin-right 0.2s ease",
          }}
          onClick={handleMainContentClick}
        >
          <Outlet />
        </div>
      </div>

      {/* ══════════ TASKS PANEL ══════════ */}
      {showTasks && (
        <div
          className="right-panel"
          style={{ width: taskWidth, right: showInteractions ? interactionWidth : 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="right-panel-header">
            <h3>Tasks{profileId && <span className="panel-profile-tag">{panelClientId ? `Client ID: ${panelClientId}` : `Profile #${profileId}`}</span>}</h3>
            <button onClick={() => setShowTasks(false)} aria-label="Close tasks panel">✕</button>
          </div>
          <div className="right-panel-content">
            <TaskPane key={`tasks-${location.pathname}`} profileid={profileId} clientid={panelClientId} />
          </div>
          <div className="resize-handle-right" onMouseDown={e => { e.stopPropagation(); startResize("tasks", e); }} />
        </div>
      )}

      {/* ══════════ INTERACTIONS PANEL ══════════ */}
      {showInteractions && (
        <div
          className="right-panel"
          style={{ width: interactionWidth, right: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="right-panel-header">
            <h3>Interactions{profileId && <span className="panel-profile-tag">{panelClientId ? `Client ID: ${panelClientId}` : `Profile #${profileId}`}</span>}</h3>
            <button onClick={() => setShowInteractions(false)} aria-label="Close interactions panel">✕</button>
          </div>
          <div className="right-panel-content">
            <InteractionPane key={`interactions-${location.pathname}`} profileid={profileId} clientid={panelClientId} />
          </div>
          <div className="resize-handle-right" onMouseDown={e => { e.stopPropagation(); startResize("interactions", e); }} />
        </div>
      )}

      {/* ══════════ LOCK ICON (bottom-right) ══════════ */}
      {iconVisible && (
        <button
          onClick={handleLockIconClick}
          title={isUnlocked ? "Lock secret box" : "Unlock secret box"}
          style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 1600,
            width: "42px", height: "42px", borderRadius: "50%",
            background: isUnlocked ? "var(--amber, #c97b2e)" : "var(--surface)",
            border: "1.5px solid var(--border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            fontSize: "17px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease"
          }}
        >
          {isUnlocked ? "🔓" : "🔒"}
        </button>
      )}

      {/* ══════════ PASSWORD MODAL ══════════ */}
      {showPasswordModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "32px 28px", width: "340px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid var(--border)" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔒</div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>Secret Box</h3>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--ink-3)" }}>Enter your login password to continue</p>
            </div>
            <input
              type="password"
              className="ps-input"
              placeholder="Your password"
              value={pwdValue}
              autoFocus
              onChange={e => { setPwdValue(e.target.value); setPwdError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSecretUnlock()}
              style={{ width: "100%", boxSizing: "border-box", marginBottom: "10px" }}
            />
            {pwdError && <p style={{ fontSize: "13px", color: "#c0392b", margin: "0 0 10px", textAlign: "center" }}>{pwdError}</p>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn-secondary" onClick={() => setShowPasswordModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="ps-search-btn" onClick={handleSecretUnlock} disabled={pwdLoading} style={{ flex: 1 }}>
                {pwdLoading ? "Verifying..." : "Unlock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ SECRET FLOATING BOX ══════════ */}
      {showSecretBox && isUnlocked && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "fixed", left: boxPos.x, top: boxPos.y, zIndex: 1500,
            width: boxSize.w, height: boxMinimized ? "auto" : boxSize.h,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            minWidth: "280px"
          }}
        >
          {/* Header — drag handle */}
          <div
            onMouseDown={onBoxDragStart}
            style={{ padding: "12px 14px", borderBottom: boxMinimized ? "none" : "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "move", background: "var(--bg)", borderRadius: boxMinimized ? "var(--r-lg)" : "var(--r-lg) var(--r-lg) 0 0", userSelect: "none" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px" }}>🔓</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>Secret Notes</span>
              <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>· Profile #{secretProfileId}</span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={() => setBoxMinimized(v => !v)} title={boxMinimized ? "Expand" : "Minimize"}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", fontSize: "14px", padding: "2px 6px", borderRadius: "4px" }}>
                {boxMinimized ? "▲" : "─"}
              </button>
              <button onClick={() => setShowSecretBox(false)} title="Close"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", fontSize: "14px", padding: "2px 6px", borderRadius: "4px" }}>✕</button>
            </div>
          </div>

          {/* Body */}
          {!boxMinimized && (
            <>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {secretLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}><div className="ps-spinner" /></div>
                ) : (
                  secretNotes.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-3)" }}>
                      <div style={{ fontSize: "28px", marginBottom: "6px" }}>📝</div>
                      <p style={{ fontSize: "12px", margin: 0 }}>No secret notes yet</p>
                    </div>
                  ) : secretNotes.map((note) => (
                    <div key={note.id} style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", fontSize: "12px", color: "var(--ink-2)", lineHeight: 1.6, display: "flex", justifyContent: "space-between", gap: "8px" }}>
                      <span style={{ flex: 1 }}>{note.text}</span>
                      <button onClick={() => handleHideNote(note.id)} title="Remove"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", fontSize: "13px", padding: 0, flexShrink: 0 }}>✕</button>
                    </div>
                  ))
                )}
                {secretError && <p style={{ fontSize: "12px", color: "#c0392b", textAlign: "center", margin: 0 }}>{secretError}</p>}
              </div>

              {/* Add note */}
              <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
                <textarea
                  className="ps-input"
                  placeholder="Write a private note..."
                  value={secretNewNote}
                  onChange={e => setSecretNewNote(e.target.value)}
                  rows={2}
                  style={{ width: "100%", resize: "none", boxSizing: "border-box", marginBottom: "6px", fontFamily: "inherit", fontSize: "12px" }}
                />
                <button
                  className="ps-search-btn"
                  onClick={handleAddSecretNote}
                  disabled={secretSaving || !secretNewNote.trim()}
                  style={{ width: "100%", fontSize: "12px", padding: "7px" }}
                >
                  {secretSaving ? "Saving..." : "Save Note"}
                </button>
              </div>

              {/* Resize handle */}
              <div
                onMouseDown={onBoxResizeStart}
                style={{ position: "absolute", bottom: 0, right: 0, width: "16px", height: "16px", cursor: "se-resize", background: "linear-gradient(135deg, transparent 50%, var(--border) 50%)", borderRadius: "0 0 var(--r-lg) 0" }}
              />
            </>
          )}
        </div>
      )}

    </div>
  );
}