import type {
  LegalEvidence,
  LegalEvidenceDetails,
  LegalMediaType,
} from "../../services/legalInvestigationService";

import styles from "./LegalDashboardPage.module.css";

const MEDIA: { type: LegalMediaType; label: string; key: keyof LegalEvidence }[] =
  [
    { type: "image", label: "Abrir imagem", key: "hasImage" },
    { type: "audio", label: "Reproduzir áudio", key: "hasAudio" },
    { type: "video", label: "Reproduzir vídeo", key: "hasVideo" },
    { type: "thumbnail", label: "Ver miniatura", key: "hasThumbnail" },
    { type: "document", label: "Abrir documento", key: "hasDocument" },
  ];

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

type Props = {
  evidence: LegalEvidence;
  details?: LegalEvidenceDetails;
  verifying: boolean;
  loadingMediaId: string | null;
  onVerify: () => void;
  onOpenMedia: (type: LegalMediaType) => void;
};

export default function EvidenceCard({
  evidence,
  details,
  verifying,
  loadingMediaId,
  onVerify,
  onOpenMedia,
}: Props) {
  const snapshot = details?.snapshot as { content?: string | null } | null;

  return (
    <div className={styles.evidenceBox}>
      <p className={styles.evidenceTitle}>
        Evidência preservada · {evidence.messageType}
      </p>

      <p className={styles.evidenceMeta}>
        Capturada em {formatDate(evidence.capturedAt)}
        {evidence.originalDeletedAt
          ? " · a mensagem original foi eliminada depois da captura"
          : ""}
        <br />
        Mensagem: {evidence.messageId}
        <br />
        Hash SHA-256: {evidence.evidenceHash.slice(0, 16)}…
      </p>

      <div className={styles.evidenceActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={verifying}
          onClick={onVerify}
        >
          {verifying ? "A verificar..." : "Verificar integridade e ver original"}
        </button>

        {MEDIA.filter(item => evidence[item.key]).map(item => (
          <button
            key={item.type}
            type="button"
            className={styles.secondaryButton}
            disabled={loadingMediaId !== null}
            onClick={() => onOpenMedia(item.type)}
          >
            {loadingMediaId === `${evidence.id}:${item.type}`
              ? "A abrir..."
              : item.label}
          </button>
        ))}
      </div>

      {details && (
        <div className={styles.evidenceOk}>
          <strong>
            {details.integrityVerified
              ? "✓ Integridade confirmada pelo servidor."
              : "Integridade não confirmada."}
          </strong>

          <p className={styles.evidenceSnapshot}>
            {snapshot?.content?.trim() || "O conteúdo original não tem texto."}
          </p>
        </div>
      )}
    </div>
  );
}