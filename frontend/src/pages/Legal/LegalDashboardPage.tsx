import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
  useRef
} from "react";
import { Navigate } from "react-router-dom";
import { ClipboardList, FilePlus2, Search } from "lucide-react";

import { useAuth } from "../../auth/AuthProvider";
import PanelSection from "../../components/panel/PanelSection";
import EvidenceCard from "./EvidenceCard"

import {
  startLegalInvestigation,
  listLegalInvestigations,
  searchLegalMessages,
  type LegalInvestigation,
  type LegalInvestigationScope,
  type LegalMessageSearchResult,
  listLegalEvidence,
  listLegalEvidenceForMessages,
  getLegalEvidenceMedia,
  type LegalEvidence,
  type LegalMediaType,
    completeLegalInvestigation,
  failLegalInvestigation,
  getLegalEvidence,
  type LegalEvidenceDetails,
} from "../../services/legalInvestigationService";

import styles from "./LegalDashboardPage.module.css";

type Area = "list" | "search" | "start";

function getStatusLabel(status: string): string {
  switch (status) {
    case "STARTED":
      return "Em andamento";
    case "COMPLETED":
      return "Concluída";
    case "FAILED":
      return "Falhou";
    default:
      return status;
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case "STARTED":
      return styles.statusStarted;
    case "COMPLETED":
      return styles.statusCompleted;
    case "FAILED":
      return styles.statusFailed;
    default:
      return styles.statusUnknown;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function LegalDashboardPage() {
  const { user } = useAuth();

  // ---------- Acordeão: só uma área aberta de cada vez ----------

  const [activeArea, setActiveArea] = useState<Area | null>("list");

  function areaProps(area: Area) {
    return {
      open: activeArea === area,
      onOpenChange: (next: boolean) => setActiveArea(next ? area : null),
    };
  }

  // ---------- Iniciar investigação ----------

  const [legalReference, setLegalReference] = useState("");
  const [reason, setReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ---------- Lista ----------

  const [investigations, setInvestigations] = useState<
    LegalInvestigation[]
  >([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  // ---------- Pesquisa de mensagens ----------

  const [selectedInvestigation, setSelectedInvestigation] =
    useState<LegalInvestigation | null>(null);


const [querySearchTerm, setQuerySearchTerm] = useState("");
const [queryFromDate, setQueryFromDate] = useState("");
const [queryToDate, setQueryToDate] = useState("");

const [searchingMessages, setSearchingMessages] = useState(false);
const [searchError, setSearchError] = useState("");
const [messages, setMessages] = useState<LegalMessageSearchResult[]>([]);
const [hasMoreMessages, setHasMoreMessages] = useState(false);
const [nextMessageCursor, setNextMessageCursor] = useState<string | null>(null);
const [messageResultCount, setMessageResultCount] = useState(0);



const [evidenceItems, setEvidenceItems] = useState<LegalEvidence[]>([]);
const [loadingEvidence, setLoadingEvidence] = useState(false);
const [evidenceError, setEvidenceError] = useState("");

const [loadingMediaId, setLoadingMediaId] = useState<string | null>(null);
const [mediaError, setMediaError] = useState("");

const [evidenceDetails, setEvidenceDetails] = useState<
  Record<string, LegalEvidenceDetails>
>({});
const [verifyingId, setVerifyingId] = useState<string | null>(null);
const [closingId, setClosingId] = useState<string | null>(null);

const mediaUrlRef = useRef<string | null>(null);

const [activeMedia, setActiveMedia] = useState<{
  url: string;
  type: LegalMediaType;
  filename: string;
} | null>(null);


  const loadInvestigations = useCallback(async () => {
    setLoadingList(true);
    setListError("");

    try {
      const result = await listLegalInvestigations();
      setInvestigations(result);
    } catch (err: any) {
      setListError(
        err.response?.data?.message ??
          "Não foi possível carregar as investigações.",
      );
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
  mediaUrlRef.current = activeMedia?.url ?? null;
}, [activeMedia]);

useEffect(() => {
  return () => {
    if (mediaUrlRef.current) URL.revokeObjectURL(mediaUrlRef.current);
  };
}, []);

  useEffect(() => {
    if (user?.role === "LEGAL_INVESTIGATOR") {
      void loadInvestigations();
    }
  }, [user?.role, loadInvestigations]);

  if (user?.role !== "LEGAL_INVESTIGATOR") {
    return <Navigate to="/" replace />;
  }

  // ---------- Iniciar investigação ----------

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const scope: LegalInvestigationScope = {
      ...(userId.trim() && { userId: userId.trim() }),
      ...(storeId.trim() && { storeId: storeId.trim() }),
      ...(conversationId.trim() && {
        conversationId: conversationId.trim(),
      }),
      ...(messageId.trim() && { messageId: messageId.trim() }),
      ...(searchTerm.trim() && { searchTerm: searchTerm.trim() }),
      ...(fromDate && {
        fromDate: new Date(fromDate).toISOString(),
      }),
      ...(toDate && {
        toDate: new Date(toDate).toISOString(),
      }),
    };

    if (
  !scope.userId &&
  !scope.storeId &&
  !scope.conversationId &&
  !scope.messageId
) {
  setError(
    "Indica pelo menos um utilizador, banca, conversa ou mensagem. As datas só restringem esse âmbito.",
  );
  return;
}
    if (
      scope.fromDate &&
      scope.toDate &&
      new Date(scope.fromDate) > new Date(scope.toDate)
    ) {
      setError("A data inicial não pode ser posterior à data final.");
      return;
    }

    setLoading(true);

    try {
      const result = await startLegalInvestigation({
        legalReference: legalReference.trim(),
        reason: reason.trim(),
        scope,
      });

      setSuccess(
        `Investigação iniciada com sucesso. Referência interna: ${result.id}`,
      );

      setLegalReference("");
      setReason("");
      setSearchTerm("");
      setUserId("");
      setStoreId("");
      setConversationId("");
      setMessageId("");
      setFromDate("");
      setToDate("");

      await loadInvestigations();
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          "Não foi possível iniciar a investigação. Verifica as permissões e os dados enviados.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------- Pesquisa de mensagens ----------


function selectInvestigation(investigation: LegalInvestigation) {
  setSelectedInvestigation(investigation);

  setQuerySearchTerm("");
  setQueryFromDate("");
  setQueryToDate("");

  setMessages([]);
  setHasMoreMessages(false);
  setNextMessageCursor(null);
  setMessageResultCount(0);
  setSearchError("");

  setEvidenceItems([]);
setEvidenceError("");
setMediaError("");
void loadEvidence(investigation.id);

  // Abre a pesquisa e recolhe a lista.
  setActiveArea("search");
  setEvidenceDetails({});
}

function closeSearch() {
    setSelectedInvestigation(null);
    setMessages([]);
    setSearchError("");
    setActiveArea("list");

    setEvidenceItems([]);
setEvidenceError("");
setMediaError("");
closeEvidenceMedia();
setEvidenceDetails({});
  }

function buildMessageSearchInput(cursor?: string) {
  if (!selectedInvestigation) {
    throw new Error("Seleciona uma investigação primeiro.");
  }

  return {
    investigationId: selectedInvestigation.id,
    ...(querySearchTerm.trim() && {
      searchTerm: querySearchTerm.trim(),
    }),
    ...(queryFromDate && {
      fromDate: new Date(queryFromDate).toISOString(),
    }),
    ...(queryToDate && {
      toDate: new Date(queryToDate).toISOString(),
    }),
    limit: 50,
    ...(cursor && { cursor }),
  };
}


  async function handleMessageSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedInvestigation) return;

    setSearchError("");
    setSearchingMessages(true);

    if (
      queryFromDate &&
      queryToDate &&
      new Date(queryFromDate) > new Date(queryToDate)
    ) {
      setSearchError("A data inicial não pode ser posterior à data final.");
      setSearchingMessages(false);
      return;
    }

    try {
      const result = await searchLegalMessages(buildMessageSearchInput());

      setMessages(result.messages);
      setHasMoreMessages(result.hasMore);
      setNextMessageCursor(result.nextCursor);
      setMessageResultCount(result.resultCount);

      try {
  mergeEvidence(
    await listLegalEvidenceForMessages(
      selectedInvestigation.id,
      result.messages.map(message => message.id),
    ),
  );
} catch {
  // o painel de evidências já mostra o seu próprio erro
}
    } catch (err: any) {
      setSearchError(
        err.response?.data?.message ??
          err.message ??
          "Não foi possível pesquisar as mensagens.",
      );
    } finally {
      setSearchingMessages(false);
    }
  }

  async function handleLoadMoreMessages() {
  if (!selectedInvestigation || !nextMessageCursor || searchingMessages) {
    return;
  }

  setSearchError("");
  setSearchingMessages(true);

  try {
    const result = await searchLegalMessages(
      buildMessageSearchInput(nextMessageCursor),
    );

    const newMessageIds = result.messages.map(
      (message) => message.id,
    );

    const newEvidence = await listLegalEvidenceForMessages(
      selectedInvestigation.id,
      newMessageIds,
    );

    setMessages((previous) => {
      const existingIds = new Set(
        previous.map((message) => message.id),
      );

      return [
        ...previous,
        ...result.messages.filter(
          (message) => !existingIds.has(message.id),
        ),
      ];
    });

    setEvidenceItems((previous) => {
      const evidenceById = new Map(
        previous.map((item) => [item.id, item]),
      );

      for (const item of newEvidence) {
        evidenceById.set(item.id, item);
      }

      return Array.from(evidenceById.values());
    });

    setHasMoreMessages(result.hasMore);
    setNextMessageCursor(result.nextCursor);
    setMessageResultCount((previous) => previous + result.resultCount);
  } catch (err: any) {
    setSearchError(
      err.response?.data?.message ??
        err.message ??
        "Não foi possível carregar mais mensagens e respetivas evidências.",
    );
  } finally {
    setSearchingMessages(false);
  }
}


async function loadEvidence(investigationId: string) {
  setLoadingEvidence(true);
  setEvidenceError("");

  try {
    const result = await listLegalEvidence(investigationId);
    setEvidenceItems(result);
  } catch (err: any) {
    setEvidenceError(
      err.response?.data?.message ??
        "Não foi possível carregar as evidências preservadas.",
    );
    setEvidenceItems([]);
  } finally {
    setLoadingEvidence(false);
  }
}

async function openEvidenceMedia(
  evidence: LegalEvidence,
  mediaType: LegalMediaType,
) {
  if (!selectedInvestigation) return;

  setLoadingMediaId(`${evidence.id}:${mediaType}`);
  setMediaError("");

  try {
    const blob = await getLegalEvidenceMedia(
      selectedInvestigation.id,
      evidence.id,
      mediaType,
    );

    const url = URL.createObjectURL(blob);

    setActiveMedia(current => {
  if (current) URL.revokeObjectURL(current.url);

  return {
    url,
    type: mediaType,
    filename: evidence.documentName || `evidencia-${evidence.id}`,
  };
});
  } catch (err: any) {
    setMediaError(
      err.response?.data?.message ??
        "Não foi possível abrir o conteúdo preservado.",
    );
  } finally {
    setLoadingMediaId(null);
  }
}

function closeEvidenceMedia() {
  setActiveMedia(current => {
    if (current) URL.revokeObjectURL(current.url);
    return null;
  });
}

function mergeEvidence(incoming: LegalEvidence[]) {
  setEvidenceItems(previous => {
    const byId = new Map(previous.map(item => [item.id, item]));
    for (const item of incoming) byId.set(item.id, item);
    return Array.from(byId.values());
  });
}

async function verifyEvidence(evidence: LegalEvidence) {
  if (!selectedInvestigation) return;

  setVerifyingId(evidence.id);
  setMediaError("");

  try {
    const details = await getLegalEvidence(
      selectedInvestigation.id,
      evidence.id,
    );

    setEvidenceDetails(previous => ({ ...previous, [evidence.id]: details }));
  } catch (err: any) {
    setMediaError(
      err.response?.data?.message ??
        "Não foi possível verificar a integridade desta evidência.",
    );
  } finally {
    setVerifyingId(null);
  }
}

async function finishInvestigation(
  investigation: LegalInvestigation,
  outcome: "complete" | "fail",
) {
  let errorMessage = "";

  if (outcome === "fail") {
    const input = window.prompt("Indica o motivo da falha:");
    if (!input?.trim()) return;
    errorMessage = input.trim();
  } else if (
    !window.confirm(
      "Concluir esta investigação? Deixa de ser possível pesquisar mensagens. As evidências continuam preservadas.",
    )
  ) {
    return;
  }

  const resultCount =
    selectedInvestigation?.id === investigation.id
      ? messageResultCount
      : investigation.resultCount;

  setClosingId(investigation.id);
  setListError("");

  try {
    if (outcome === "complete") {
      await completeLegalInvestigation(investigation.id, resultCount);
    } else {
      await failLegalInvestigation(investigation.id, errorMessage);
    }

    if (selectedInvestigation?.id === investigation.id) {
      closeSearch();
    }

    await loadInvestigations();
  } catch (err: any) {
    setListError(
      err.response?.data?.message ??
        "Não foi possível atualizar o estado da investigação.",
    );
  } finally {
    setClosingId(null);
  }
}


  // ---------- Render ----------

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>NAI-SHOPPING</p>
          <h1>Painel jurídico</h1>
          <p>Gestão de investigações e pesquisa autorizada de mensagens.</p>
        </div>
      </header>

      {/* INVESTIGAÇÕES REGISTADAS */}

      <PanelSection
        title="Investigações registadas"
        description="Consulta o histórico das investigações que iniciaste."
        icon={<ClipboardList size={20} strokeWidth={1.9} />}
        summary={`${investigations.length} registada${
          investigations.length === 1 ? "" : "s"
        }`}
        actions={
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void loadInvestigations()}
            disabled={loadingList}
          >
            {loadingList ? "A atualizar..." : "Atualizar lista"}
          </button>
        }
        {...areaProps("list")}
      >
        <div className={`${styles.card} ${styles.flat}`}>
          {listError && (
            <div className={styles.error} role="alert">
              {listError}
            </div>
          )}

          {loadingList ? (
            <p className={styles.emptyState}>A carregar investigações...</p>
          ) : investigations.length === 0 ? (
            <p className={styles.emptyState}>
              Ainda não existem investigações registadas.
            </p>
          ) : (
            <div className={styles.investigationList}>
              {investigations.map(investigation => (
                <article
                  key={investigation.id}
                  className={styles.investigationItem}
                >
                  <div className={styles.investigationTop}>
                    <div>
                      <p className={styles.investigationReference}>
                        Referência: {investigation.legalReference}
                      </p>
                      <p className={styles.investigationDate}>
                        {formatDate(investigation.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`${styles.status} ${getStatusClass(
                        investigation.status,
                      )}`}
                    >
                      {getStatusLabel(investigation.status)}
                    </span>
                  </div>

                  <p className={styles.investigationReason}>
                    {investigation.reason}
                  </p>

                  <div className={styles.investigationMeta}>
                    <span>
                      Resultados registados: {investigation.resultCount}
                    </span>
                    <span className={styles.investigationId}>
                      ID: {investigation.id}
                    </span>
                  </div>

                  <div className={styles.itemActions}>
  <button
  type="button"
  className={styles.secondaryButton}
  onClick={() => selectInvestigation(investigation)}
>
  {investigation.status === "STARTED"
    ? "Pesquisar mensagens"
    : "Ver evidências"}
</button>

  {investigation.status === "STARTED" && (
    <>
      <button
        type="button"
        className={styles.secondaryButton}
        disabled={closingId === investigation.id}
        onClick={() => void finishInvestigation(investigation, "complete")}
      >
        Concluir
      </button>

      <button
        type="button"
        className={styles.secondaryButton}
        disabled={closingId === investigation.id}
        onClick={() => void finishInvestigation(investigation, "fail")}
      >
        Marcar falha
      </button>
    </>
  )}
</div>

                  {investigation.status === "FAILED" &&
                    investigation.errorMessage && (
                      <p className={styles.investigationError}>
                        Falha: {investigation.errorMessage}
                      </p>
                    )}
                </article>
              ))}
            </div>
          )}
        </div>
      </PanelSection>

      {/* PESQUISAR MENSAGENS */}

      {selectedInvestigation && (
        <PanelSection
          title="Pesquisar mensagens"
          description={`Investigação selecionada: ${selectedInvestigation.legalReference}`}
          icon={<Search size={20} strokeWidth={1.9} />}
          summary={
            messages.length > 0 ? `${messageResultCount} mensagens` : undefined
          }
          actions={
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={closeSearch}
            >
              Fechar pesquisa
            </button>
          }
          {...areaProps("search")}
        >
          <div
            className={`${styles.card} ${styles.flat}`}
            id="legal-message-search"
          >
            <p className={styles.investigationId}>
              ID: {selectedInvestigation.id}
            </p>

            {selectedInvestigation.status !== "STARTED" ? (
              <>
  <p className={styles.description}>
    Esta investigação já não está em andamento, por isso não é possível
    pesquisar novas mensagens. As evidências preservadas continuam
    disponíveis para consulta.
  </p>

  {loadingEvidence && (
    <p className={styles.emptyState}>A carregar evidências preservadas...</p>
  )}

  {evidenceError && (
    <div className={styles.error} role="alert">
      {evidenceError}
    </div>
  )}

  {!loadingEvidence && !evidenceError && evidenceItems.length === 0 ? (
    <p className={styles.emptyState}>
      Esta investigação não tem evidências preservadas.
    </p>
  ) : (
    <div className={styles.investigationList}>
      {evidenceItems.map(evidence => (
        <EvidenceCard
          key={evidence.id}
          evidence={evidence}
          details={evidenceDetails[evidence.id]}
          verifying={verifyingId === evidence.id}
          loadingMediaId={loadingMediaId}
          onVerify={() => void verifyEvidence(evidence)}
          onOpenMedia={type => void openEvidenceMedia(evidence, type)}
        />
      ))}
    </div>
  )}
</>
            ) : (
              <>
                <p className={styles.description}>
                  Os filtros adicionais apenas podem restringir o âmbito da
                  investigação original. O servidor valida a autorização.
                </p>

                {searchError && (
                  <div className={styles.error} role="alert">
                    {searchError}
                  </div>
                )}

                <form onSubmit={handleMessageSearch}>
                  <label>
                    Termo a procurar
                    <input
                      value={querySearchTerm}
                      onChange={event =>
                        setQuerySearchTerm(event.target.value)
                      }
                      maxLength={500}
                      placeholder="Palavra ou expressão presente na mensagem"
                    />
                  </label>


<div className={styles.grid}>
  <label>
    Data inicial (opcional)
    <input
      type="datetime-local"
      value={queryFromDate}
      onChange={event => setQueryFromDate(event.target.value)}
    />
  </label>

  <label>
    Data final (opcional)
    <input
      type="datetime-local"
      value={queryToDate}
      onChange={event => setQueryToDate(event.target.value)}
    />
  </label>
</div>


                  <button type="submit" disabled={searchingMessages}>
                    {searchingMessages
                      ? "A pesquisar..."
                      : "Pesquisar mensagens"}
                  </button>
                </form>

{loadingEvidence && (
  <p className={styles.emptyState}>
    A carregar evidências preservadas...
  </p>
)}

{evidenceError && (
  <div className={styles.error} role="alert">
    {evidenceError}
    <button
      type="button"
      className={styles.secondaryButton}
      onClick={() => {
        if (selectedInvestigation) {
          void loadEvidence(selectedInvestigation.id);
        }
      }}
    >
      Tentar novamente
    </button>
  </div>
)}

                <div className={styles.searchResultsHeader}>
                  <h3>Resultados</h3>
                  <span>{messageResultCount} mensagem(ns) carregada(s)</span>
                </div>

                {messages.length === 0 && !searchingMessages ? (
                  <p className={styles.emptyState}>
                    Ainda não existem resultados para apresentar. Executa uma
                    pesquisa para consultar as mensagens.
                  </p>
                ) : (
                  <div className={styles.investigationList}>
                    {messages.map(message => (
                      <article
                        key={message.id}
                        className={styles.investigationItem}
                      >

<div className={styles.investigationTop}>
  <div>
    <p className={styles.investigationReference}>
      {message.senderName || "Remetente desconhecido"}
    </p>
    <p className={styles.investigationDate}>
      {formatDate(message.createdAt)}
    </p>
  </div>

  <span className={styles.status}>
    {message.messageType}
  </span>
</div>


                        <p className={styles.messageContent}>
                          {message.content?.trim() ||
                            "Esta mensagem não contém texto."}
                        </p>

                        {message.deletedAt && (
                          <p className={styles.messageNotice}>
                            Esta mensagem foi marcada como eliminada.
                          </p>
                        )}

                        <div className={styles.investigationMeta}>
                          <span>Conversa: {message.conversationId}</span>
                          <span>Mensagem: {message.id}</span>
                        </div>


{(() => {
  const evidence = evidenceItems.find(
    item => item.messageId === message.id,
  );

  if (!evidence) {
    return message.imageUrl ||
      message.audioUrl ||
      message.videoUrl ||
      message.documentName ? (
      <p className={styles.messageNotice}>
        Esta mensagem referencia conteúdo multimédia e ainda não tem
        evidência preservada. Isto é esperado se foi enviada depois do
        início da investigação e nunca foi editada nem eliminada.
      </p>
    ) : null;
  }

  return (
    <EvidenceCard
      evidence={evidence}
      details={evidenceDetails[evidence.id]}
      verifying={verifyingId === evidence.id}
      loadingMediaId={loadingMediaId}
      onVerify={() => void verifyEvidence(evidence)}
      onOpenMedia={type => void openEvidenceMedia(evidence, type)}
    />
  );
})()}

                      </article>
                    ))}
                  </div>
                )}

                {hasMoreMessages && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => void handleLoadMoreMessages()}
                    disabled={searchingMessages}
                  >
                    {searchingMessages
                      ? "A carregar..."
                      : "Carregar mais mensagens"}
                  </button>
                )}
              </>
            )}
          </div>
        </PanelSection>
      )}

      {/* INICIAR INVESTIGAÇÃO */}

      <PanelSection
        title="Iniciar investigação"
        description="Regista a referência legal, a justificação e o âmbito. O servidor validará o teu perfil e os dados."
        icon={<FilePlus2 size={20} strokeWidth={1.9} />}
        {...areaProps("start")}
      >
        <div className={`${styles.card} ${styles.flat}`}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className={styles.success} role="status">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label>
              Referência legal *
              <input
                value={legalReference}
                onChange={event => setLegalReference(event.target.value)}
                required
                maxLength={300}
                placeholder="Ex.: número do processo"
              />
            </label>

            <label>
              Motivo da investigação *
              <textarea
                value={reason}
                onChange={event => setReason(event.target.value)}
                required
                maxLength={2000}
                rows={4}
                placeholder="Descreve a justificação legal."
              />
            </label>

            <h3>Âmbito autorizado</h3>

            <div className={styles.grid}>
              <label>
                ID do utilizador
                <input
                  value={userId}
                  onChange={event => setUserId(event.target.value)}
                />
              </label>

              <label>
                ID da banca
                <input
                  value={storeId}
                  onChange={event => setStoreId(event.target.value)}
                />
              </label>

              <label>
                ID da conversa
                <input
                  value={conversationId}
                  onChange={event => setConversationId(event.target.value)}
                />
              </label>

              <label>
                ID da mensagem
                <input
                  value={messageId}
                  onChange={event => setMessageId(event.target.value)}
                />
              </label>

              <label>
                Data inicial
                <input
                  type="datetime-local"
                  value={fromDate}
                  onChange={event => setFromDate(event.target.value)}
                />
              </label>

              <label>
                Data final
                <input
                  type="datetime-local"
                  value={toDate}
                  onChange={event => setToDate(event.target.value)}
                />
              </label>
            </div>

            <label>
              Termo de pesquisa opcional
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                maxLength={500}
                placeholder="Termo relacionado com a investigação"
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "A iniciar..." : "Iniciar investigação"}
            </button>
          </form>
        </div>
      </PanelSection>


{mediaError && (
  <div className={styles.error} role="alert">
    {mediaError}
  </div>
)}

{activeMedia && (
  <div className={styles.mediaOverlay}>
    <section
      className={styles.mediaDialog}
      role="dialog"
      aria-modal="true"
      aria-label="Conteúdo multimédia preservado"
    >
      <div className={styles.mediaHeader}>
        <div>
          <h2>Conteúdo preservado</h2>
          <p>{activeMedia.filename}</p>
        </div>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={closeEvidenceMedia}
        >
          Fechar
        </button>
      </div>

      <div className={styles.mediaViewer}>
        {activeMedia.type === "image" ||
        activeMedia.type === "thumbnail" ? (
          <img src={activeMedia.url} alt={activeMedia.filename} />
        ) : activeMedia.type === "audio" ? (
          <audio src={activeMedia.url} controls />
        ) : activeMedia.type === "video" ? (
          <video src={activeMedia.url} controls playsInline />
        ) : (
          <div className={styles.documentViewer}>
            <p>
              Documento preservado: {activeMedia.filename}
            </p>

            <a
              href={activeMedia.url}
              download={activeMedia.filename}
            >
              Abrir ou descarregar documento
            </a>
          </div>
        )}
      </div>
    </section>
  </div>
)}

    </div>
  );
}