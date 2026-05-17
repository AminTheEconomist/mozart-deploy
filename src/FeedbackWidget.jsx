// ─── FEEDBACK WIDGET ─────────────────────────────────────────────────────────
// Floating button that opens a modal with text + voice input. Submissions go to
// /api/feedback (Vercel serverless function) which logs them for later review.
// Voice uses the browser Web Speech API — free, no infra needed, Chrome/Safari/Edge.

import { useState, useRef, useEffect } from "react";
import { useWork } from "./WorkContext.jsx";

const SANS = (lang) => ({
  fontFamily: lang === "fa"
    ? "'Vazirmatn','Inter','Tahoma',sans-serif"
    : "'Inter','Helvetica Neue',sans-serif",
  direction: lang === "fa" ? "rtl" : "ltr",
});

export function FeedbackWidget({ lang, view, selected }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [reply, setReply] = useState(null);
  const recognitionRef = useRef(null);
  const { STR } = useWork();
  const t = STR[lang].feedback;
  const dir = lang === "fa" ? "rtl" : "ltr";

  // Web Speech API setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang === "fa" ? "fa-IR" : "en-CA";
    r.onresult = (e) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
      }
      if (final) setText((prev) => (prev + final).trimStart());
    };
    r.onerror = () => setRecording(false);
    r.onend = () => setRecording(false);
    recognitionRef.current = r;
    return () => { try { r.stop(); } catch {} };
  }, [lang]);

  const toggleRecord = () => {
    const r = recognitionRef.current;
    if (!r) { alert(t.noSpeech); return; }
    if (recording) { r.stop(); setRecording(false); }
    else { try { r.start(); setRecording(true); } catch { setRecording(false); } }
  };

  const submit = async () => {
    if (!text.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          view,
          lang,
          movement: selected?.latin || null,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenWidth: window.innerWidth,
        }),
      });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json().catch(() => ({}));
      try {
        const log = JSON.parse(localStorage.getItem("mozart_feedback_log") || "[]");
        log.push({ text: text.trim(), view, lang, at: new Date().toISOString(), reply: data.reply || null });
        localStorage.setItem("mozart_feedback_log", JSON.stringify(log));
      } catch {}
      setReply(data.reply || null);
      setStatus("sent");
      // If Claude replied, keep modal open longer so user can read it
      const closeAfter = data.reply ? 6000 : 1800;
      setTimeout(() => { setOpen(false); setText(""); setStatus("idle"); setReply(null); }, closeAfter);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  return (
    <>
      {/* Floating button — classname lets App.jsx CSS lift it above the
          mobile bottom-bar nav without an inline media query */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t.openLabel}
        className="feedback-fab"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          [lang === "fa" ? "right" : "left"]: "1.5rem",
          zIndex: 250,
          width: 54,
          height: 54,
          borderRadius: "50%",
          border: "1px solid rgba(184,137,58,.5)",
          background: "rgba(15,12,8,.92)",
          backdropFilter: "blur(14px)",
          color: "#b8893a",
          fontSize: "1.4rem",
          cursor: "pointer",
          boxShadow: "0 8px 28px rgba(0,0,0,.45),0 0 0 0 rgba(184,137,58,.3)",
          transition: "all .3s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.07)";
          e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,.55),0 0 24px rgba(184,137,58,.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,.45),0 0 0 0 rgba(184,137,58,.3)";
        }}
      >✦</button>

      {/* Modal */}
      {open && (
        <div
          onClick={() => status === "idle" && setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 260,
            background: "rgba(0,0,0,.78)",
            backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1.5rem",
            animation: "fadeIn .2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f0c08",
              border: "1px solid rgba(184,137,58,.4)",
              maxWidth: 520, width: "100%",
              padding: "2rem 2rem 1.75rem",
              position: "relative",
              boxShadow: "0 0 80px rgba(184,137,58,.15)",
              animation: "slideUp .3s ease",
              ...SANS(lang),
            }}
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute",
                top: "1rem",
                [lang === "fa" ? "left" : "right"]: "1rem",
                background: "none",
                border: "none",
                color: "rgba(255,255,255,.5)",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
            >✕</button>

            <div style={{ fontSize: ".68rem", letterSpacing: ".25em", color: "#b8893a", marginBottom: ".5rem", textTransform: "uppercase" }}>
              {t.eyebrow}
            </div>
            <h3 style={{
              fontFamily: lang === "fa" ? "'Amiri','Vazirmatn',serif" : "'Cormorant Garamond',serif",
              fontWeight: 700, fontSize: "1.6rem",
              color: "#f3ead5",
              marginBottom: ".5rem",
              lineHeight: 1.2,
            }}>{t.title}</h3>
            <p style={{ fontSize: ".88rem", color: "rgba(255,255,255,.55)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              {t.subtitle}
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.placeholder}
              rows={5}
              disabled={status !== "idle"}
              style={{
                width: "100%",
                padding: ".85rem 1rem",
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(184,137,58,.25)",
                color: "#f3ead5",
                fontSize: "1rem",
                lineHeight: 1.7,
                resize: "vertical",
                outline: "none",
                ...SANS(lang),
                textAlign: lang === "fa" ? "right" : "left",
                marginBottom: ".85rem",
              }}
            />

            {/* Status hint */}
            <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.4)", marginBottom: "1rem", minHeight: "1rem" }}>
              {recording && <span style={{ color: "#e74c3c" }}>● {t.recording}</span>}
              {status === "sending" && <span style={{ color: "#b8893a" }}>{t.sending}</span>}
              {status === "sent" && !reply && <span style={{ color: "#5a9d5a" }}>✓ {t.sent}</span>}
              {status === "error" && <span style={{ color: "#e74c3c" }}>{t.error}</span>}
              {status === "idle" && !recording && (
                <span>{t.contextHint} <strong style={{ color: "rgba(184,137,58,.7)" }}>{STR[lang].viewLabels[view] || view}</strong></span>
              )}
            </div>

            {/* Claude's reply, when it comes back */}
            {status === "sent" && reply && (
              <div style={{ background: "rgba(184,137,58,.08)", border: "1px solid rgba(184,137,58,.3)", padding: "1rem 1.1rem", marginBottom: "1rem", animation: "slideUp .3s ease" }}>
                <div style={{ fontSize: ".62rem", letterSpacing: ".2em", color: "#b8893a", marginBottom: ".5rem", textTransform: "uppercase" }}>{t.claudeReplyLabel}</div>
                <p style={{ fontSize: ".95rem", color: "#f3ead5", lineHeight: 1.75, textAlign: lang === "fa" ? "right" : "left" }}>{reply}</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: ".6rem", justifyContent: "space-between", alignItems: "center", flexDirection: lang === "fa" ? "row-reverse" : "row" }}>
              <button
                onClick={toggleRecord}
                disabled={status !== "idle"}
                title={t.micTitle}
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  border: `1px solid ${recording ? "#e74c3c" : "rgba(184,137,58,.4)"}`,
                  background: recording ? "rgba(231,76,60,.15)" : "rgba(255,255,255,.03)",
                  color: recording ? "#e74c3c" : "#b8893a",
                  cursor: status === "idle" ? "pointer" : "default",
                  fontSize: "1.1rem",
                  transition: "all .2s",
                }}
              >{recording ? "■" : "🎤"}</button>

              <button
                onClick={submit}
                disabled={!text.trim() || status !== "idle"}
                style={{
                  flex: 1,
                  padding: ".85rem 1.5rem",
                  border: "none",
                  background: text.trim() && status === "idle" ? "#b8893a" : "rgba(184,137,58,.25)",
                  color: text.trim() && status === "idle" ? "#1a1208" : "rgba(243,234,213,.5)",
                  fontFamily: lang === "fa" ? "'Vazirmatn',sans-serif" : "'Inter',sans-serif",
                  fontSize: ".95rem",
                  fontWeight: 700,
                  letterSpacing: ".05em",
                  cursor: text.trim() && status === "idle" ? "pointer" : "default",
                  transition: "all .2s",
                  textTransform: "uppercase",
                }}
              >{t.send}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  );
}
