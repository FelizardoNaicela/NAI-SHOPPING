import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import styles from "./PanelSection.module.css";

type PanelSectionProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Mostrado no cabeçalho (útil quando a secção está recolhida) */
  summary?: ReactNode;
  /** Botões à direita do cabeçalho (não ativam o recolher/expandir) */
  actions?: ReactNode;
  defaultOpen?: boolean;
  /** Se definido, lembra se a secção ficou aberta ou fechada */
  storageKey?: string;
  children: ReactNode;
};

function readStoredOpen(key: string | undefined, fallback: boolean) {
  if (!key) return fallback;

  try {
    const value = window.localStorage.getItem(key);
    if (value === "1") return true;
    if (value === "0") return false;
  } catch {
    // ignora (modo privado, etc.)
  }

  return fallback;
}

export default function PanelSection({
  title,
  description,
  icon,
  summary,
  actions,
  defaultOpen = true,
  storageKey,
  children,
}: PanelSectionProps) {
  const [open, setOpen] = useState(() =>
    readStoredOpen(storageKey, defaultOpen),
  );

  const contentId = useId();

  function toggle() {
    setOpen(prev => {
      const next = !prev;

      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, next ? "1" : "0");
        } catch {
          // ignora
        }
      }

      return next;
    });
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.toggle}
          onClick={toggle}
          aria-expanded={open}
          aria-controls={contentId}
        >
          {icon && <span className={styles.icon}>{icon}</span>}

          <span className={styles.titleBlock}>
            <span className={styles.title}>{title}</span>

            {description && (
              <span className={styles.description}>{description}</span>
            )}
          </span>

          {summary && <span className={styles.summary}>{summary}</span>}

          <ChevronDown
            size={20}
            strokeWidth={2}
            className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
          />
        </button>

        {actions && <div className={styles.actions}>{actions}</div>}
      </div>

      <div
        id={contentId}
        className={`${styles.body} ${open ? styles.bodyOpen : ""}`}
      >
        <div className={styles.bodyInner}>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// AÇÕES RÁPIDAS
// =========================================================

export function QuickActionGrid({ children }: { children: ReactNode }) {
  return <div className={styles.quickGrid}>{children}</div>;
}

type QuickActionProps = {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
};

export function QuickAction({
  icon,
  title,
  description,
  onClick,
  highlight = false,
}: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.quickAction} ${
        highlight ? styles.quickActionHighlight : ""
      }`}
    >
      <span className={styles.quickIcon}>{icon}</span>

      <span className={styles.quickText}>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}