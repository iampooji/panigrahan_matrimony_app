import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../../api/apiClient";
import { loadFormEnums } from "../../logic/enumStore";
import { shareProfile } from "../../api/profileMatchApi";

const CITY_QUESTION_ID = 5;

/* ── Searchable city dropdown ── */
function CitySelect({ value, onChange, inputStyle }) {
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState(value || "");
  const [open,   setOpen]   = useState(false);

  useEffect(() => {
    api("/addresses/cities").then(data => {
      if (Array.isArray(data)) setCities(data);
    });
  }, []);

  useEffect(() => { setSearch(value || ""); }, [value]);

  const filtered = cities.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const select = (city) => {
    setSearch(city);
    onChange(city);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        style={inputStyle}
        placeholder="Type to search city..."
        value={search}
        onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)", boxShadow: "var(--shadow-md)",
          maxHeight: "180px", overflowY: "auto", marginTop: "2px"
        }}>
          {filtered.map(city => (
            <div
              key={city}
              onMouseDown={() => select(city)}
              style={{
                padding: "8px 12px", fontSize: "13px", cursor: "pointer",
                color: "var(--ink-2)",
                background: city === value ? "var(--amber-dim)" : "transparent"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
              onMouseLeave={e => e.currentTarget.style.background = city === value ? "var(--amber-dim)" : "transparent"}
            >
              {city}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfileMatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.fromProfile || `/profiles/${id}`;
  const [previewIndex, setPreviewIndex] = useState(null);

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enums, setEnums] = useState(null);
  const [filters, setFilters] = useState({
    agegap: "",
    minincome: "",
    minnetworth: "",
    birthstar: []
  });
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [currentProfile, setCurrentProfile] = useState(null);
  const [interactions, setInteractions] = useState({});
  const [prefquestions, setPrefquestions] = useState([]);
  const [prefanswers, setPrefanswers] = useState([]);
  const matchedProfiles = interactions;
  const newProfiles = profiles;

  useEffect(() => { loadFormEnums("profile").then(setEnums); }, []);

  useEffect(() => {
    const init = async () => {
      // Load profile first — we need gender for opposite gender question fetch
      const p = await api(`/profiles/${id}`);
      setCurrentProfile(p);

      const oppositeGender = p.gender === 1 ? 2 : 1;

      // Fetch preferences with opposite gender for match filter questions
      const res = await api(`/profiles/${id}/preferences?forgender=${oppositeGender}`);

      // Build initial filters from saved preferences
      const initialFilters = {
        agegap:      res.pref?.agegap      ? res.pref.agegap      : "",
        minincome:   res.pref?.minincome   ? res.pref.minincome   : "",
        minnetworth: res.pref?.minnetworth ? res.pref.minnetworth : "",
        birthstar:   res?.stars ? res.stars.map(s => s.birthstar) : [],
      };
      setFilters(initialFilters);

      // Build initial prefanswers from saved answers
      let initialAnswers = [];
      if (res?.prefanswers) {
        initialAnswers = res.prefanswers.map(a => {
          const question = res.prefquestions?.find(q => q.id === a.questionid);
          if (question?.answertype === 3 && typeof a.answer === "string")
            return { ...a, answer: a.answer.split(",") };
          return a;
        });
        setPrefanswers(initialAnswers);
      }

      if (res?.prefquestions) setPrefquestions(res.prefquestions);

      // Pass values directly — don't rely on state which hasn't updated yet
      await loadMatches(initialFilters, initialAnswers);
      await loadInteractions();
    };
    init();
  }, [id]);

  useEffect(() => {
    const handler = (e) => {
      if (previewIndex === null) return;
      if (e.key === "Escape") setPreviewIndex(null);
      if (e.key === "ArrowLeft") setPreviewIndex(i => i > 0 ? i - 1 : i);
      if (e.key === "ArrowRight") setPreviewIndex(i => i < newProfiles.length - 1 ? i + 1 : i);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewIndex, newProfiles.length]);

  const setAnswer = (questionid, answer, isMulti = false) => {
    setPrefanswers(prev => {
      const existing = prev.find(a => a.questionid === questionid);
      if (isMulti) {
        const prevValues = Array.isArray(existing?.answer) ? existing.answer : [];
        const updatedValues = prevValues.includes(answer)
          ? prevValues.filter(v => v !== answer)
          : [...prevValues, answer];
        if (existing) return prev.map(a => a.questionid === questionid ? { ...a, answer: updatedValues } : a);
        return [...prev, { questionid, answer: updatedValues }];
      }
      if (existing) return prev.map(a => a.questionid === questionid ? { ...a, answer } : a);
      return [...prev, { questionid, answer }];
    });
  };

  const loadMatches = async (f = filters, answers = prefanswers) => {
    setLoading(true);
    const q = new URLSearchParams();
    q.set("profileId", id);
    Object.entries(f).forEach(([k, v]) => {
      if (Array.isArray(v)) { if (!v.length) return; q.set(k, v.join(",")); }
      else if (typeof v === "boolean") { q.set(k, v ? "1" : "0"); }
      else if (v !== "" && v !== null && v !== undefined) { q.set(k, v); }
    });
    answers.forEach(a => {
      if (!a.answer) return;
      if (Array.isArray(a.answer) && !a.answer.length) return;
      const val = Array.isArray(a.answer) ? a.answer.join(",") : a.answer;
      q.set(`pref_${a.questionid}`, val);
    });
    const res = await api(`/profilematch/match?${q.toString()}`);
    setProfiles(Array.isArray(res) ? res : res?.results || []);
    setLoading(false);
  };

  const loadInteractions = async (val) => {
    const rows = await api(`/profilematch/${id}/interactions?includeRejected=${val}`);
    setInteractions(rows);
  };

  const share = async (matchId) => {
    await shareProfile(id, matchId);
    setProfiles(prev => prev.filter(p => p.id !== matchId));
    loadInteractions();
  };

  const handleReject = async () => {
    await api(`/profilematch/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ rejectedprofileid: rejecting.id, reasoncode: reason })
    });
    setProfiles(prev => prev.filter(p => p.id !== rejecting.id));
    setRejecting(null);
    setReason("");
    await loadInteractions();
    await loadMatches();
  };

  if (!enums) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div className="ps-spinner" />
    </div>
  );

  const inputStyle = {
    height: "42px", padding: "0 13px", borderRadius: "var(--r-sm)",
    border: "1.5px solid var(--border)", background: "var(--bg)",
    color: "var(--ink)", fontFamily: "var(--font-ui)", fontSize: "13.5px",
    outline: "none", width: "100%"
  };

  const chipStyle = (on) => ({
    display: "inline-flex", alignItems: "center", gap: "5px",
    padding: "4px 10px", borderRadius: "9999px", cursor: "pointer",
    fontSize: "11.5px", fontWeight: on ? 700 : 500,
    background: on ? "var(--amber-dim)" : "var(--bg)",
    border: `1px solid ${on ? "rgba(200,105,42,.4)" : "var(--border)"}`,
    color: on ? "var(--amber)" : "var(--ink-3)"
  });

  const renderCard = (p) => (
    <div key={p.id} style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--r-md)", overflow: "hidden", boxShadow: "var(--shadow-xs)",
      transition: "transform 260ms var(--spring), box-shadow 260ms ease, border-color 260ms ease",
      animation: "cardIn .4s var(--smooth) both"
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--border-2)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <div style={{ position: "relative", aspectRatio: "3/4", background: "var(--bg-2)", overflow: "hidden" }}>
        <img
          src={p.profilePicture?.file_url ? `http://localhost:8080${p.profilePicture.file_url}` : "/placeholder-profile.png"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 420ms ease" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
          onClick={() => {
                            const originalIndex = newProfiles.findIndex(i => i.id === p.id);
                            setPreviewIndex(originalIndex);
                          }}
        />
        <span style={{
          position: "absolute", top: "10px", right: "10px",
          width: "10px", height: "10px", borderRadius: "50%",
          border: "2px solid #fff", boxShadow: "var(--shadow-xs)",
          background: p.gender === 1 ? "#5d8ac4" : "var(--rose-light)"
        }} />
      </div>

      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--ink)", letterSpacing: "-.01em" }}>
          {p.firstname} {p.lastname}
        </div>
        <div style={{ fontSize: "11.5px", color: "var(--ink-4)", fontWeight: 500, marginTop: "2px" }}>
          Age: {p.age}
        </div>

        <div style={{ display: "flex", gap: "6px", marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
          {[
            { label: "View",   color: "var(--amber)",  action: () => navigate(`/profiles/${p.id}`, { state: { backTo: location.pathname } }) },
            { label: "Share",  color: "var(--teal)",   action: () => share(p.id) },
            { label: "Reject", color: "var(--danger)", action: () => setRejecting(p) }
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} style={{
              flex: 1, padding: "6px 4px", textAlign: "center",
              fontSize: "12px", fontWeight: 600, color: btn.color,
              background: "transparent", border: "1.5px solid var(--border)",
              borderRadius: "var(--r-xs)", cursor: "pointer",
              transition: "all 160ms ease"
            }}
              onMouseEnter={e => { e.currentTarget.style.background = btn.color === "var(--danger)" ? "rgba(192,57,43,.08)" : "var(--amber-dim)"; e.currentTarget.style.borderColor = btn.color; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {interactions[p.id] && (
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <select
              style={{ ...inputStyle, height: "34px", fontSize: "12px", flex: 1 }}
              value={interactions[p.id].status || ""}
              onChange={async (e) => {
                await api("/profilematch/status", {
                  method: "POST",
                  body: JSON.stringify({ profileid: id, matchprofileid: p.id, status: e.target.value })
                });
                loadInteractions();
              }}
            >
              {enums.matchstatus.options.map(o => (
                <option key={o.enumvalue} value={o.enumvalue}>{o.strvalue}</option>
              ))}
            </select>

            <select
              style={{ ...inputStyle, height: "34px", fontSize: "12px", flex: 1 }}
              value={interactions[p.id].reasoncode || ""}
              onChange={async (e) => {
                await api("/profilematch/status", {
                  method: "POST",
                  body: JSON.stringify({ profileid: id, matchprofileid: p.id, reasoncode: e.target.value })
                });
                loadInteractions();
              }}
            >
              <option value="">Reason</option>
              {enums.rejectionreason.options.map(o => (
                <option key={o.enumvalue} value={o.enumvalue}>{o.strvalue}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "36px 40px", maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px", animation: "fadeIn .3s ease both" }}>

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => navigate(backTo)} style={{
          background: "none", border: "none", color: "var(--amber)",
          fontSize: "13.5px", fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: "6px"
        }}>
          ← Back to Profile
        </button>
        <div>
          <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--amber)", textAlign: "center" }}>Matching</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, fontStyle: "italic", color: "var(--ink)" }}>
            Profile Matches
          </h2>
        </div>
        <span style={{
          padding: "5px 14px", borderRadius: "9999px",
          background: "var(--amber-dim)", border: "1px solid rgba(200,105,42,.3)",
          fontSize: "12px", fontWeight: 700, color: "var(--amber)"
        }}>
          {matchedProfiles.length} found
        </span>
      </div>

      {/* Current Profile Banner */}
      {currentProfile && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", padding: "16px 20px",
          display: "flex", alignItems: "center", gap: "16px",
          boxShadow: "var(--shadow-xs)", animation: "fadeUp .4s var(--smooth) both"
        }}>
          <img
            src={currentProfile.profilePicture?.file_url ? `http://localhost:8080${currentProfile.profilePicture.file_url}` : "/placeholder-profile.png"}
            style={{ width: "60px", height: "60px", borderRadius: "var(--r-sm)", objectFit: "cover", border: "2px solid var(--amber-ring)" }}
          />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "18px", color: "var(--ink)" }}>
              {currentProfile.firstname} {currentProfile.lastname}
            </div>
            <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Age: {currentProfile.age}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
            {filters.agegap && ( 
              <span style={{ padding: "4px 12px", borderRadius: "9999px", background: "var(--bg-2)", border: "1px solid var(--border)", fontSize: "12px", color: "var(--ink-3)" }}>
                Age Gap {filters.agegap} Yrs
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", padding: "24px 28px",
        boxShadow: "var(--shadow-xs)", animation: "fadeUp .4s var(--smooth) .05s both"
      }}>
        <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--amber)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <span>Filters</span>
          <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {/* Basic filters */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px 16px", marginBottom: "20px" }}>
          {[
            { key: "agegap",      label: "Age Gap" },
            { key: "minincome",   label: "Min Income" },
            { key: "minnetworth", label: "Min Net Worth" }
          ].map(f => (
            <div key={f.key}>
              <div style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: "5px" }}>{f.label}</div>
              <input
                type="number" placeholder="Any" style={inputStyle}
                value={filters[f.key]}
                onChange={e => { const v = e.target.value; if (v === "" || Number(v) >= 0) setFilters(prev => ({ ...prev, [f.key]: v })); }}
                onFocus={e => { e.target.style.borderColor = "var(--amber)"; e.target.style.boxShadow = "0 0 0 3px var(--amber-ring)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          ))}
        </div>

        {/* Birth Stars */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)" }}>
              Birth Stars
              {filters.birthstar.length > 0 && (
                <span style={{
                  marginLeft: "8px", padding: "1px 7px", borderRadius: "9999px",
                  background: "var(--amber-dim)", border: "1px solid rgba(200,105,42,.3)",
                  fontSize: "10px", fontWeight: 700, color: "var(--amber)"
                }}>
                  {filters.birthstar.length} selected
                </span>
              )}
            </div>
            {filters.birthstar.length > 0 && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, birthstar: [] }))}
                style={{
                  background: "none", border: "none", fontSize: "11.5px",
                  color: "var(--danger)", cursor: "pointer", fontWeight: 600,
                  padding: "2px 6px", borderRadius: "var(--r-xs)",
                  transition: "opacity 150ms ease"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Clear
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "90px", overflowY: "auto", padding: "10px", background: "var(--bg)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
            {enums.birthstar.options.map(o => {
              const checked = filters.birthstar.includes(o.enumvalue);
              return (
                <label key={o.enumvalue} style={chipStyle(checked)}>
                  <input type="checkbox" checked={checked} onChange={() => {
                    setFilters(prev => ({
                      ...prev,
                      birthstar: checked
                        ? prev.birthstar.filter(b => b !== o.enumvalue)
                        : [...prev.birthstar, o.enumvalue]
                    }));
                  }} style={{ display: "none" }} />
                  {o.strvalue}
                </label>
              );
            })}
          </div>
        </div>

        {/* Additional Preferences */}
        {prefquestions.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--amber)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              Additional Preferences
              <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {prefquestions.map(qo => {
                const currentAnswer = prefanswers.find(a => a.questionid === qo.id);

                if (qo.id === CITY_QUESTION_ID) {
                  return (
                    <div key={qo.id}>
                      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: "6px" }}>
                        {qo.questiontxt}
                      </div>
                      <CitySelect
                        value={currentAnswer?.answer || ""}
                        onChange={val => setAnswer(qo.id, val)}
                        inputStyle={inputStyle}
                      />
                    </div>
                  );
                }

                return (
                  <div key={qo.id}>
                    <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: "6px" }}>
                      {qo.questiontxt}
                    </div>

                    {qo.answertype === 1 && (
                      <input style={inputStyle} placeholder="Any"
                        value={currentAnswer?.answer || ""}
                        onChange={e => setAnswer(qo.id, e.target.value)}
                        onFocus={e => { e.target.style.borderColor = "var(--amber)"; e.target.style.boxShadow = "0 0 0 3px var(--amber-ring)"; }}
                        onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                      />
                    )}

                    {qo.answertype === 2 && (
                      <select style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                        value={currentAnswer?.answer || ""}
                        onChange={e => setAnswer(qo.id, e.target.value)}
                      >
                        <option value="">Any</option>
                        {qo.ansopts.split(",").map(opt => opt.trim()).map((opt, idx) => (
                          <option key={idx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {qo.answertype === 3 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {qo.ansopts.split(",").map(opt => opt.trim()).map((opt, idx) => {
                          const checked = Array.isArray(currentAnswer?.answer) && currentAnswer.answer.includes(opt);
                          return (
                            <label key={idx} style={chipStyle(checked)}>
                              <input type="checkbox" checked={checked} onChange={() => setAnswer(qo.id, opt, true)} style={{ display: "none" }} />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {qo.answertype === 4 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {qo.ansopts.split(",").map(opt => opt.trim()).map((opt, idx) => {
                          const checked = currentAnswer?.answer === opt;
                          return (
                            <label key={idx} style={chipStyle(checked)}>
                              <input type="radio" name={`pref-question-${qo.id}`} value={opt} checked={checked} onChange={() => setAnswer(qo.id, opt)} style={{ display: "none" }} />
                              {opt}
                            </label>
                          );
                        })}
                        {currentAnswer?.answer && (
                          <button onClick={() => setAnswer(qo.id, "")} style={{ background: "none", border: "none", fontSize: "11px", color: "var(--ink-4)", cursor: "pointer", textDecoration: "underline" }}>Clear</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => loadMatches(filters, prefanswers)}
            style={{
              padding: "11px 32px", border: "none", borderRadius: "var(--r-sm)",
              background: "linear-gradient(110deg, var(--amber), var(--rose-light))",
              color: "#fff", fontSize: "13.5px", fontWeight: 700, letterSpacing: ".04em",
              cursor: "pointer", boxShadow: "0 4px 14px rgba(200,105,42,.3)",
              transition: "transform 160ms ease, box-shadow 160ms ease"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(200,105,42,.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(200,105,42,.3)"; }}
          >
            Find Matching Profiles
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
          <div className="ps-spinner" />
        </div>
      )}

      {/* ================= ALREADY MATCHED ================= */}
      <h3 className="text-md font-semibold mb-3 mt-6 text-primary">
        Already Matched
      </h3>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            onChange={e => loadInteractions(e.target.checked)}
          />
          Show rejected
        </label>
      </div>
      {matchedProfiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {matchedProfiles.map(renderCard)}
        </div>
      )}

      {/* New suggestions */}
      {!loading && newProfiles.length > 0 && (
        <div>
          <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-3)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            New Suggestions <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
            {newProfiles.map(renderCard)}
          </div>
        </div>
      )}

      {!loading && profiles.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "72px 24px", gap: "12px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--bg-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>🔍</div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink-2)" }}>No matches found</div>
          <div style={{ fontSize: "13px", color: "var(--ink-4)" }}>Try adjusting your filters</div>
        </div>
      )}

      {/* Reject Modal */}
      {rejecting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(18,14,10,.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn .2s ease both" }}>
          <div style={{ background: "var(--surface)", padding: "32px", borderRadius: "var(--r-lg)", width: "340px", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)", animation: "scaleIn .3s var(--smooth) both" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "20px", color: "var(--ink)", marginBottom: "16px" }}>
              Reject Profile
            </h3>
            <select
              style={{ width: "100%", height: "44px", padding: "0 13px", borderRadius: "var(--r-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--ink)", fontSize: "13.5px", outline: "none", appearance: "none", marginBottom: "20px" }}
              value={reason}
              onChange={e => setReason(e.target.value)}
            >
              <option value="">Select reason</option>
              {enums.rejectionreason.options.map(o => (
                <option key={o.enumvalue} value={o.enumvalue}>{o.strvalue}</option>
              ))}
            </select>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setRejecting(null)} className="btn-secondary" style={{ padding: "9px 20px", fontSize: "13px" }}>Cancel</button>
              <button onClick={handleReject} style={{ padding: "9px 20px", borderRadius: "var(--r-sm)", border: "none", background: "var(--danger)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {previewIndex !== null && (
        <div className="image-modal-overlay" onClick={() => setPreviewIndex(null)}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreviewIndex(null)}>✕</button>
            <div className="image-modal-zoom-wrap">
              <Link to={`/profiles/${newProfiles[previewIndex]?.id}`} target="_blank" style={{ textDecoration: "none" }}>
                <p className="ps-table-name" style={{ cursor: "pointer", color: "white", margin: "10px" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--amber)"}
                  onMouseLeave={e => e.currentTarget.style.color = "white"}>
                  {newProfiles[previewIndex]?.firstname} {newProfiles[previewIndex]?.lastname} - ({newProfiles[previewIndex]?.id})
                  <br></br>
                  {newProfiles[previewIndex]?.birthdate} ({newProfiles[previewIndex]?.age})
                  <br></br>
                  {newProfiles[previewIndex]?.swagothranm?.gothraname}
                </p>
              </Link>
              <img src={`http://localhost:8080${newProfiles[previewIndex]?.profilePicture.file_url}`} alt="Preview" />
            </div>
            <div style={{ position: "absolute", bottom: "-52px", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => setPreviewIndex(i => i > 0 ? i - 1 : i)} className="modal-zoom-btn" disabled={previewIndex === 0} style={{ opacity: previewIndex === 0 ? 0.4 : 1 }}>←</button>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", minWidth: "60px", textAlign: "center" }}>
                {previewIndex + 1} / {newProfiles.length}
              </span>
              <button onClick={() => setPreviewIndex(i => i < newProfiles.length - 1 ? i + 1 : i)} className="modal-zoom-btn" disabled={previewIndex === newProfiles.length - 1} style={{ opacity: previewIndex === newProfiles.length - 1 ? 0.4 : 1 }}>→</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}