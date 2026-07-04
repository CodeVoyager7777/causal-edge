export default function ConsensusFeed({ consensus }) {
  return (
    <div
      style={{
        background: "rgba(13,21,32,0.7)",
        border: "1px solid rgba(30,45,66,0.8)",
        borderRadius: 16,
        padding: "20px",
        maxHeight: 380,
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 48px -12px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.2em",
          color: "#5B7A99",
          textTransform: "uppercase",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#A78BFA",
            boxShadow: "0 0 8px #A78BFA",
            animation: "led-pulse 2s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
        LEDGER COMMITS
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {consensus.length === 0 ? (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: 80 }}>
            <p style={{ fontFamily: "monospace", fontSize: 11, color: "#2A3F58", textAlign: "center" }}>
              Awaiting fleet consensus...
              <br />
              <span style={{ color: "#1E2D42" }}>Inject a fault to trigger consensus round.</span>
            </p>
          </div>
        ) : (
          consensus.map((c, i) => (
            <div
              key={i}
              style={{
                background: "rgba(167,139,250,0.05)",
                border: "1px solid rgba(167,139,250,0.12)",
                borderRadius: 10,
                padding: "12px 14px",
                animation: i === 0 ? "fadeInUp 0.4s ease" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span
                  style={{
                    fontFamily: "'Chakra Petch', sans-serif",
                    fontSize: 11,
                    color: "#A78BFA",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  {c.subsystem} FAULT
                </span>
                <span style={{ fontFamily: "monospace", fontSize: 9, color: "#2A3F58", letterSpacing: "0.1em" }}>
                  #{c.round_id}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(c.confidence * 100).toFixed(0)}%`,
                      background: "#A78BFA",
                      borderRadius: 2,
                      boxShadow: "0 0 6px #A78BFA",
                    }}
                  />
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#A78BFA", flexShrink: 0 }}>
                  {(c.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#00D4A1", marginTop: 6, letterSpacing: "0.05em" }}>
                ✓ Hash committed to ledger
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
