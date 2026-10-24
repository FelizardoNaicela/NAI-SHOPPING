import { useCallback, useEffect, useState } from "react";
import { Scale } from "lucide-react";

import PanelSection from "../../components/panel/PanelSection";
import {
  listLegalInvestigators,
  promoteToLegalInvestigator,
  searchLegalInvestigatorCandidates,
  setLegalInvestigatorStatus,
  type LegalInvestigatorCandidate,
  type LegalInvestigatorItem,
  type LegalInvestigatorStatus,
} from "../../services/adminLegalInvestigators";

import styles from "./AdminLegalInvestigators.module.css";

const STATUS_LABEL: Record<LegalInvestigatorStatus, string> = {
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  REVOKED: "Revogado",
};

export default function AdminLegalInvestigators() {
  const [items, setItems] = useState<LegalInvestigatorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<LegalInvestigatorCandidate[]>(
    [],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setItems(await listLegalInvestigators());
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Não foi possível carregar os investigadores.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // pesquisa com pequena pausa
  useEffect(() => {
    if (query.trim().length < 2) {
      setCandidates([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setCandidates(await searchLegalInvestigatorCandidates(query.trim()));
      } catch {
        setCandidates([]);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  async function promote(candidate: LegalInvestigatorCandidate) {
    const label = candidate.name ?? candidate.email;

    if (
      !window.confirm(
        `Promover ${label} a investigador legal? Esta conta passará a poder pesquisar mensagens de conversas, com auditoria.`,
      )
    ) {
      return;
    }

    try {
      setBusyId(candidate.id);
      setError("");
      await promoteToLegalInvestigator(candidate.id);
      setMessage(
        `${label} é agora investigador legal. Tem de terminar a sessão e entrar de novo.`,
      );
      setQuery("");
      setCandidates([]);
      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Não foi possível promover.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus(
    item: LegalInvestigatorItem,
    status: LegalInvestigatorStatus,
  ) {
    const label = item.user.name ?? item.user.email;

    const action =
      status === "REVOKED"
        ? "revogar"
        : status === "SUSPENDED"
          ? "suspender"
          : "reativar";

    if (!window.confirm(`Deseja ${action} ${label}?`)) {
      return;
    }

    try {
      setBusyId(item.id);
      setError("");
      await setLegalInvestigatorStatus(item.id, status);
      setMessage("Estado atualizado.");
      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Não foi possível atualizar.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PanelSection
      title="Investigadores legais"
      description="Contas autorizadas a pesquisar mensagens mediante ordem judicial."
      icon={<Scale size={20} strokeWidth={1.9} />}
      storageKey="adminPanel:legalInvestigators"
      defaultOpen={false}
      summary={`${items.filter(i => i.status === "ACTIVE").length} ativo(s)`}
    >
      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}

      <div>
        <label className={styles.label} htmlFor="li-search">
          Promover uma conta
        </label>

        <input
          id="li-search"
          className={styles.input}
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setMessage("");
          }}
          placeholder="Nome, email ou username (mín. 2 letras)"
        />

        {candidates.length > 0 && (
          <div className={styles.results}>
            {candidates.map(candidate => (
              <div key={candidate.id} className={styles.row}>
                <div className={styles.who}>
                  <strong>{candidate.name ?? "Sem nome"}</strong>
                  <span>{candidate.email}</span>
                </div>

                <button
                  type="button"
                  className={styles.primary}
                  disabled={busyId === candidate.id}
                  onClick={() => void promote(candidate)}
                >
                  Promover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className={styles.empty}>A carregar...</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Ainda não existem investigadores.</p>
      ) : (
        <div className={styles.results}>
          {items.map(item => (
            <div key={item.id} className={styles.row}>
              <div className={styles.who}>
                <strong>{item.user.name ?? "Sem nome"}</strong>
                <span>{item.user.email}</span>
              </div>

              <span
                className={`${styles.badge} ${styles[`s${item.status}`]}`}
              >
                {STATUS_LABEL[item.status]}
              </span>

              {item.status !== "REVOKED" && (
                <div className={styles.actions}>
                  {item.status === "ACTIVE" ? (
                    <button
                      type="button"
                      className={styles.secondary}
                      disabled={busyId === item.id}
                      onClick={() => void changeStatus(item, "SUSPENDED")}
                    >
                      Suspender
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.secondary}
                      disabled={busyId === item.id}
                      onClick={() => void changeStatus(item, "ACTIVE")}
                    >
                      Reativar
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.danger}
                    disabled={busyId === item.id}
                    onClick={() => void changeStatus(item, "REVOKED")}
                  >
                    Revogar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PanelSection>
  );
}