import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/apiClient";
import { loadFormEnums } from "../../logic/enumStore";

const CITY_QUESTION_ID = 5;

/* ── Searchable city dropdown ── */
function CitySelect({ value, onChange, inputStyle }) {
  const [cities,  setCities]  = useState([]);
  const [search,  setSearch]  = useState(value || "");
  const [open,    setOpen]    = useState(false);

  useEffect(() => {
    api("/addresses/cities").then(data => {
      if (Array.isArray(data)) setCities(data);
    });
  }, []);

  useEffect(() => {
    setSearch(value || "");
  }, [value]);

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

export default function ProfilePreference() {
  const { id }   = useParams();
  const [profile, setProfile] = useState("");
  const navigate = useNavigate();

  const [pref, setPref] = useState({ agegap: "",  minincome: "", minnetworth: "" });
  const [stars,         setStars]         = useState([]);
  const [prefquestions, setPrefquestions] = useState([]);
  const [prefanswers,   setPrefanswers]   = useState([]);
  const [enums,         setEnums]         = useState(null);
  // const [currentProfile, setCurrentProfile] = useState(null);

  useEffect(() => {
    loadFormEnums("profile").then(setEnums);
    api(`/profiles/${id}/preferences`).then((res) => {
      if (res.pref)          setPref(res.pref);
      if (res.prefquestions) setPrefquestions(res.prefquestions);
      if (res.prefanswers) {
        setPrefanswers(res.prefanswers.map(a => {
          const q = res.prefquestions?.find(q => q.id === a.questionid);
          if (q?.answertype === 3 && typeof a.answer === "string")
            return { ...a, answer: a.answer.split(",") };
          return a;
        }));
      }
      if (res.stars) setStars(res.stars.map(s => s.birthstar));
      if (res.profile) setProfile(res.profile);
    });
  }, [id]);

  //  useEffect(() => {
  //   if (!id) return;

  //   const fetchClientId = async () => {
  //     try {
  //       const res = await api(`/profiles/${id}`);
  //       setProfile(res);
  //       setCurrentProfile(res);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  //   fetchClientId();
  // }, [id]);

  const toggleStar = (value) =>
    setStars(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);

  const getAnswer = (questionid) =>
    prefanswers.find(a => a.questionid === questionid)?.answer;

  const setAnswer = (questionid, answer, isMulti = false) => {
    setPrefanswers(prev => {
      const existing = prev.find(a => a.questionid === questionid);
      if (isMulti) {
        const vals    = Array.isArray(existing?.answer) ? existing.answer : [];
        const updated = vals.includes(answer) ? vals.filter(v => v !== answer) : [...vals, answer];
        if (existing) return prev.map(a => a.questionid === questionid ? { ...a, answer: updated } : a);
        return [...prev, { questionid, answer: updated }];
      }
      if (existing) return prev.map(a => a.questionid === questionid ? { ...a, answer } : a);
      return [...prev, { questionid, answer }];
    });
  };

  const save = async () => {
    const formattedAnswers = prefanswers.map(a => {
      const q = prefquestions.find(q => q.id === a.questionid);
      if (q?.answertype === 3 && Array.isArray(a.answer))
        return { ...a, answer: a.answer.join(",") };
      return a;
    });
    await api(`/profiles/${id}/preferences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pref, stars, prefanswers: formattedAnswers }),
    });
    navigate(`/profiles/${id}`);
  };

  if (!enums) return <div className="ps-loading"><div className="ps-spinner" /></div>;

  const inp = {
    height: "42px", padding: "0 13px", borderRadius: "var(--r-sm)",
    border: "1.5px solid var(--border)", background: "var(--bg)",
    color: "var(--ink)", fontFamily: "var(--font-ui)", fontSize: "13.5px",
    outline: "none", width: "100%",
  };

  const chip = (on) => ({
    display: "inline-flex", alignItems: "center", gap: "5px",
    padding: "4px 10px", borderRadius: "9999px", cursor: "pointer",
    fontSize: "11.5px", fontWeight: on ? 700 : 500,
    background: on ? "var(--amber-dim)" : "var(--surface)",
    border: "1px solid " + (on ? "rgba(200,105,42,.4)" : "var(--border)"),
    color: on ? "var(--amber)" : "var(--ink-3)",
    transition: "all 160ms ease", userSelect: "none",
  });

  const divider = (label) => (
    <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--amber)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
      {label}<span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
    </div>
  );

  return (
    <div style={{ padding: "36px 40px", maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p className="ps-header-eyebrow">Client #{profile.client_id || id}</p>
          <h1 className="ps-header-title">Preferences</h1>
          <div className="ps-header-bar" />
        </div>
        <button type="button" className="btn-secondary" onClick={() => navigate(`/profiles/${id}`)}>Back</button>
      </div>

      {profile && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", padding: "16px 20px",
          display: "flex", alignItems: "center", gap: "16px",
          boxShadow: "var(--shadow-xs)", animation: "fadeUp .4s var(--smooth) both"
        }}>
          <img
            src={profile.profilePicture?.file_url ? `http://localhost:8080${profile.profilePicture.file_url}` : "/placeholder-profile.png"}
            style={{ width: "60px", height: "60px", borderRadius: "var(--r-sm)", objectFit: "cover", border: "2px solid var(--amber-ring)" }}
          />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "18px", color: "var(--ink)" }}>
              {profile.firstname} {profile.lastname}
            </div>
            <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Age: {profile.age}</div>
          </div>
          {/* <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
            {filters.agegap && ( 
              <span style={{ padding: "4px 12px", borderRadius: "9999px", background: "var(--bg-2)", border: "1px solid var(--border)", fontSize: "12px", color: "var(--ink-3)" }}>
                Age Gap {filters.agegap} Yrs
              </span>
            )}
          </div> */}
        </div>
      )}

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "24px 28px", boxShadow: "var(--shadow-xs)" }}>

        {divider("Filters")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px 16px", marginBottom: "24px" }}>
          {[["agegap","Age Gap"],["minincome","Min Income"],["minnetworth","Min Net Worth"]].map(([key, label]) => (
            <div key={key}>
              <div style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: "5px" }}>{label}</div>
              <input type="number" placeholder="Any" min="0" style={inp}
                value={pref[key] || ""}
                onChange={e => { const v = e.target.value; if (v === "" || Number(v) >= 0) setPref(p => ({ ...p, [key]: v })); }}
                onFocus={e => { e.target.style.borderColor = "var(--amber)"; e.target.style.boxShadow = "0 0 0 3px var(--amber-ring)"; }}
                onBlur={e  => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          ))}
        </div>

        {/* ── Birth Stars with count badge + clear button ── */}
        <div style={{ paddingTop: "20px", borderTop: "1px solid var(--border)", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)" }}>
              Birth Stars
              {stars.length > 0 && (
                <span style={{
                  marginLeft: "8px", padding: "1px 7px", borderRadius: "9999px",
                  background: "var(--amber-dim)", border: "1px solid rgba(200,105,42,.3)",
                  fontSize: "10px", fontWeight: 700, color: "var(--amber)"
                }}>
                  {stars.length} selected
                </span>
              )}
            </div>
            {stars.length > 0 && (
              <button
                onClick={() => setStars([])}
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
              const on = stars.includes(o.enumvalue);
              return (
                <label key={o.enumvalue} style={chip(on)}>
                  <input type="checkbox" checked={on} onChange={() => toggleStar(o.enumvalue)} style={{ display: "none" }} />
                  {o.strvalue}
                </label>
              );
            })}
          </div>
        </div>

        {prefquestions.length > 0 && (
          <div style={{ paddingTop: "20px", borderTop: "1px solid var(--border)", marginBottom: "20px" }}>
            {divider("Additional Preferences")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {prefquestions.map(qo => {
                const ans = getAnswer(qo.id);

                if (qo.id === CITY_QUESTION_ID) {
                  return (
                    <div key={qo.id}>
                      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: "6px" }}>{qo.questiontxt}</div>
                      <CitySelect
                        value={ans || ""}
                        onChange={val => setAnswer(qo.id, val)}
                        inputStyle={inp}
                      />
                    </div>
                  );
                }

                return (
                  <div key={qo.id}>
                    <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: "6px" }}>{qo.questiontxt}</div>

                    {qo.answertype === 1 && (
                      <input style={inp} placeholder="Any" value={ans || ""}
                        onChange={e => setAnswer(qo.id, e.target.value)}
                        onFocus={e => { e.target.style.borderColor = "var(--amber)"; e.target.style.boxShadow = "0 0 0 3px var(--amber-ring)"; }}
                        onBlur={e  => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                      />
                    )}

                    {qo.answertype === 2 && (
                      <select style={{ ...inp, appearance: "none", cursor: "pointer" }} value={ans || ""} onChange={e => setAnswer(qo.id, e.target.value)}>
                        <option value="">Any</option>
                        {qo.ansopts.split(",").map(opt => opt.trim()).map((o, i) => <option key={i} value={o}>{o}</option>)}
                      </select>
                    )}

                    {qo.answertype === 3 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {qo.ansopts.split(",").map(opt => opt.trim()).map((o, i) => {
                          const on = Array.isArray(ans) && ans.includes(o);
                          return (
                            <label key={i} style={chip(on)}>
                              <input type="checkbox" checked={on} onChange={() => setAnswer(qo.id, o, true)} style={{ display: "none" }} />
                              {o}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {qo.answertype === 4 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {qo.ansopts.split(",").map(opt => opt.trim()).map((o, i) => {
                          const on = ans === o;
                          return (
                            <label key={i} style={chip(on)}>
                              <input type="radio" name={"pref-" + qo.id} value={o} checked={on} onChange={() => setAnswer(qo.id, o)} style={{ display: "none" }} />
                              {o}
                            </label>
                          );
                        })}
                        {ans && <button onClick={() => setAnswer(qo.id, "")} style={{ background: "none", border: "none", fontSize: "11px", color: "var(--ink-4)", cursor: "pointer", textDecoration: "underline" }}>Clear</button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
          <button type="button" className="btn-secondary" onClick={() => navigate(`/profiles/${id}`)}>Cancel</button>
          <button type="button" onClick={save}
            style={{ padding: "11px 32px", border: "none", borderRadius: "var(--r-sm)", background: "linear-gradient(110deg, var(--amber), var(--rose-light))", color: "#fff", fontSize: "13.5px", fontWeight: 700, letterSpacing: ".04em", cursor: "pointer", boxShadow: "0 4px 14px rgba(200,105,42,.3)", transition: "transform 160ms ease, box-shadow 160ms ease" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(200,105,42,.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(200,105,42,.3)"; }}
          >Save Preferences</button>
        </div>

      </div>
    </div>
  );
}