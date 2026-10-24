import { useCallback, useEffect, useState } from "react";
import { Lock } from "lucide-react";

import PanelSection from "../../components/panel/PanelSection";
import {
  listLegalHolds,
  releaseLegalHold,
  type LegalHoldItem,
  type LegalHoldStatus,
} from "../../services/adminLegalHolds";

import styles from "./AdminLegalHolds.module.css";

type Filter = LegalHoldStatus | "ALL";

const INVESTIGATION_LABEL: Record<string, string> = {
  STARTED: "Em andamento",
  COMPLETED: "Concluída",
  FAILED: "Falhou",
};

function date(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString("pt-MZ", {
        dateStyle: "short",
        timeStyle: "short",
      });
}

function scopeChips(hold: LegalHoldItem) {
  const { scope } = hold;
  const chips: string[] = [];

  if (scope.userId) chips.push(`Utilizador ${scope.userId.slice(0, 8)}…`);
  if (scope.storeId) chips.push(`Banca ${scope.storeId.slice(0, 8)}…`);
  if (scope.conversationId)
    chips.push(`Conversa ${scope.conversationId.slice(0, 8)}…`);
  if (scope.messageId) chips.push(`Mensagem ${scope.messageId.slice(0, 8)}…`);
  if (scope.fromDate) chips.push(`Desde ${date(scope.fromDate)}`);
  if (scope.toDate) chips.push(`Até ${date(scope.toDate)}`);

  return chips;
}

export default function AdminLegalHolds() {
  const [filter, setFilter] = useState<Filter>("ACTIVE");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<LegalHoldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      setItems(
        await listLegalHolds(
          filter === "ALL" ? undefined : filter,
          search.trim() || undefined,
        ),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Não foi possível carregar os Legal Holds.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [load]);

  function startRelease(id: string) {
    setReleasingId(id);
    setReason("");
    setMessage("");
  }

  async function confirmRelease(hold: LegalHoldItem) {
    try {
      setBusy(true);
      setError("");

      await releaseLegalHold(hold.id, reason.trim());

      setMessage("Legal Hold libertado. As evidências já preservadas mantêm-se.");
      setReleasingId(null);
      setReason("");

      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Não foi possível libertar o hold.",
      );
    } finally {
      setBusy(false);
    }
  }

  const activeCount = items.filter(item => item.status === "ACTIVE").length;

  return (
    <PanelSection
      title="Legal Holds"
      description="Preservação de mensagens ligada a cada investigação. Só o Super Admin pode libertar."
      icon={<Lock size={20} strokeWidth={1.9} />}
      storageKey="adminPanel:legalHolds"
      defaultOpen={false}
      summary={filter === "RELEASED" ? undefined : `${activeCount} ativo(s)`}
    >
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {(
            [
              ["ACTIVE", "Ativos"],
              ["RELEASED", "Libertados"],
              ["ALL", "Todos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`${styles.tab} ${
                filter === value ? styles.tabActive : ""
              }`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          className={styles.input}
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Pesquisar pela referência legal..."
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}

      {loading ? (
        <p className={styles.empty}>A carregar...</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Nenhum Legal Hold encontrado.</p>
      ) : (
        <div className={styles.list}>
          {items.map(hold => {
            const chips = scopeChips(hold);
            const started = hold.investigation.status === "STARTED";

            return (
              <article key={hold.id} className={styles.card}>
                <div className={styles.top}>
                  <div>
                    <strong className={styles.ref}>
                      {hold.investigation.legalReference}
                    </strong>

                    <span className={styles.meta}>
                      Criado em {date(hold.createdAt)} por{" "}
                      {hold.investigation.requestedBy.name ??
                        hold.investigation.requestedBy.email}
                    </span>
                  </div>

                  <span
                    className={`${styles.badge} ${
                      hold.status === "ACTIVE"
                        ? styles.badgeActive
                        : styles.badgeReleased
                    }`}
                  >
                    {hold.status === "ACTIVE" ? "Ativo" : "Libertado"}
                  </span>
                </div>

                <p className={styles.reason}>{hold.investigation.reason}</p>

                <div className={styles.chips}>
                  {chips.map(chip => (
                    <span key={chip} className={styles.chip}>
                      {chip}
                    </span>
                  ))}
                </div>

                <div className={styles.facts}>
                  <span>
                    Evidências preservadas: <b>{hold.evidenceCount}</b>
                  </span>

                  <span>
                    Investigação:{" "}
                    <b>
                      {INVESTIGATION_LABEL[hold.investigation.status] ??
                        hold.investigation.status}
                    </b>
                  </span>
                </div>

                {hold.status === "RELEASED" && (
                  <div className={styles.released}>
                    Libertado em {date(hold.releasedAt)} por{" "}
                    {hold.releasedBy?.name ?? hold.releasedBy?.email ?? "—"}
                    {hold.releaseReason && (
                      <>
                        <br />
                        Motivo: {hold.releaseReason}
                      </>
                    )}
                  </div>
                )}

                {hold.status === "ACTIVE" && releasingId !== hold.id && (
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => startRelease(hold.id)}
                  >
                    Libertar hold
                  </button>
                )}

                {releasingId === hold.id && (
                  <div className={styles.releaseBox}>
                    {started && (
                      <p className={styles.warn}>
                        A investigação ainda está em andamento. Depois de
                        libertar, edições e eliminações de mensagens deixam
                        de ser preservadas.
                      </p>
                    )}

                    <label htmlFor={`reason-${hold.id}`}>
                      Motivo da libertação (mínimo 10 caracteres)
                    </label>

                    <textarea
                      id={`reason-${hold.id}`}
                      rows={3}
                      maxLength={2000}
                      value={reason}
                      onChange={event => setReason(event.target.value)}
                      placeholder="Ex.: ofício que encerra o processo, com data e número"
                    />

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.secondary}
                        disabled={busy}
                        onClick={() => setReleasingId(null)}
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        className={styles.danger}
                        disabled={busy || reason.trim().length < 10}
                        onClick={() => void confirmRelease(hold)}
                      >
                        {busy ? "A libertar..." : "Confirmar libertação"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </PanelSection>
  );
}