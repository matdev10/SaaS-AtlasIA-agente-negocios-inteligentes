"use client";

import { useEffect, useRef, useState } from "react";

export type AgentStatus = "online" | "busy" | "away" | "offline";
export type AgentLogo = "headset" | "atlas" | "chat";

export const STATUS: Record<AgentStatus, { label: string; color: string; hint: string }> = {
  online:  { label: "En línea",      color: "#22c55e", hint: "Responde al instante" },
  busy:    { label: "Ocupado",       color: "#ef4444", hint: "Atendiendo otras consultas" },
  away:    { label: "Ausente",       color: "#f59e0b", hint: "Responderá en unos minutos" },
  offline: { label: "Desconectado",  color: "#6b7280", hint: "Deja tu mensaje" },
};

export const LOGOS: Record<AgentLogo, { label: string }> = {
  headset: { label: "Soporte" },
  atlas: { label: "Atlas" },
  chat: { label: "Chat" },
};

type Props = {
  value?: AgentStatus;
  onChange?: (status: AgentStatus) => void;
  logo?: AgentLogo;
  onLogoChange?: (logo: AgentLogo) => void;
  agentName?: string;
  /** false = solo muestra el estado (vista del usuario final) */
  editable?: boolean;
};

function HeadsetIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="2.5" y="13" width="4" height="6" rx="1.5" />
      <rect x="17.5" y="13" width="4" height="6" rx="1.5" />
      <path d="M19.5 19a3 3 0 0 1-3 3H13" />
    </svg>
  );
}

function GlobeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <ellipse cx="12" cy="12" rx="3.4" ry="8" />
      <path d="M4.5 12h15M6.2 8.4h11.6M6.2 15.6h11.6" />
    </svg>
  );
}

function ChatIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 16.5 4 20l3.8-1.4A8 8 0 1 0 6 16.5Z" />
      <path d="M9 11h6M9 14h3.5" />
    </svg>
  );
}

const LOGO_ICONS: Record<AgentLogo, typeof HeadsetIcon> = {
  headset: HeadsetIcon,
  atlas: GlobeIcon,
  chat: ChatIcon,
};

export default function AgentStatusSelector({
  value,
  onChange,
  logo,
  onLogoChange,
  agentName = "Agente AtlasIA",
  editable = true,
}: Props) {
  const [internal, setInternal] = useState<AgentStatus>(value ?? "online");
  const status = value ?? internal;
  const [internalLogo, setInternalLogo] = useState<AgentLogo>(logo ?? "atlas");
  const currentLogo = logo ?? internalLogo;
  const LogoIcon = LOGO_ICONS[currentLogo];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera o con Escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const select = (s: AgentStatus) => {
    setInternal(s);
    onChange?.(s);
    setOpen(false);
  };

  const selectLogo = (next: AgentLogo) => {
    setInternalLogo(next);
    onLogoChange?.(next);
  };

  const current = STATUS[status];

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block", fontFamily: "inherit" }}>
      <button
        type="button"
        onClick={() => editable && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12, padding: "6px 12px 6px 6px",
          color: "#fff", cursor: editable ? "pointer" : "default",
        }}
      >
        {/* Avatar con audífonos + punto de estado */}
        <span style={{
          position: "relative", width: 38, height: 38, borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
          display: "grid", placeItems: "center",
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.25)",
        }}>
          <LogoIcon />
          <span style={{
            position: "absolute", right: -1, bottom: -1, width: 12, height: 12,
            borderRadius: "50%", background: current.color,
            border: "2px solid #1e1033",
            boxShadow: status === "online" ? `0 0 0 3px ${current.color}33` : "none",
          }} />
        </span>

        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.2 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{agentName}</span>
          <span style={{ fontSize: 12, color: current.color }}>{current.label}</span>
        </span>

        {editable && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd"
            strokeWidth={2.5} style={{ marginLeft: 4, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      {open && (
        <ul role="listbox" style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
          minWidth: 230, margin: 0, padding: 6, listStyle: "none",
          background: "#1e1033", border: "1px solid rgba(167,139,250,0.25)",
          borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
        }}>
          <li style={{ padding: "6px 10px 2px", fontSize: 11, letterSpacing: "0.04em", color: "#a78bfa" }}>
            LOGO
          </li>
          <li style={{ display: "flex", gap: 8, padding: "6px 8px 10px" }}>
            {(Object.keys(LOGOS) as AgentLogo[]).map((id) => {
              const Icon = LOGO_ICONS[id];
              const active = id === currentLogo;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectLogo(id)}
                  style={{
                    flex: 1, display: "grid", justifyItems: "center", gap: 4,
                    padding: "8px 4px", borderRadius: 8, cursor: "pointer", color: "#fff",
                    background: active ? "rgba(124,58,237,0.35)" : "transparent",
                    border: active ? "1px solid #a78bfa" : "1px solid transparent",
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center",
                    background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
                  }}>
                    <Icon size={16} />
                  </span>
                  <span style={{ fontSize: 11 }}>{LOGOS[id].label}</span>
                </button>
              );
            })}
          </li>
          <li style={{ padding: "4px 10px 2px", fontSize: 11, letterSpacing: "0.04em", color: "#a78bfa" }}>
            ESTADO
          </li>
          {(Object.keys(STATUS) as AgentStatus[]).map((s) => {
            const item = STATUS[s];
            const active = s === status;
            return (
              <li key={s} role="option" aria-selected={active}
                onClick={() => select(s)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                  background: active ? "rgba(124,58,237,0.25)" : "transparent",
                  color: "#fff",
                }}
                onMouseEnter={(e) => !active && (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={(e) => !active && (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 11, color: "#a1a1aa" }}>{item.hint}</span>
                </span>
                {active && <span style={{ color: "#a78bfa", fontSize: 14 }}>✓</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* Ejemplo de uso en el header del chat o en la página /agents/[id]:

import AgentStatusSelector, { AgentLogo, AgentStatus } from "@/components/AgentStatusSelector";

const [status, setStatus] = useState<AgentStatus>("online");
const [logo, setLogo] = useState<AgentLogo>("atlas");

<AgentStatusSelector
  value={status}
  logo={logo}
  onLogoChange={setLogo}
  onChange={async (s) => {
    setStatus(s);
    // await fetch(`/api/agents/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: s }) });
  }}
/>

// En el widget que ve el cliente final, solo lectura:
<AgentStatusSelector value={status} logo={logo} editable={false} />
*/
