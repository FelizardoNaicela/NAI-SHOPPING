import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X, Flag, Send } from "lucide-react";
import { api } from "../../services/api";
import "./ReportModal.css";

type ReportTargetType = "STORE" | "PRODUCT" | "POST" | "USER";

type ReportReason =
  | "FRAUD"
  | "SCAM"
  | "MISLEADING_INFORMATION"
  | "PROHIBITED_PRODUCT"
  | "COUNTERFEIT_PRODUCT"
  | "INAPPROPRIATE_CONTENT"
  | "HARASSMENT"
  | "IMPERSONATION"
  | "OTHER";

type Props = {
  open: boolean;
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
};

const reasons: { value: ReportReason; label: string }[] = [
  { value: "FRAUD", label: "Fraude" },
  { value: "SCAM", label: "Burla ou tentativa de burla" },
  { value: "MISLEADING_INFORMATION", label: "Informações enganosas" },
  { value: "PROHIBITED_PRODUCT", label: "Produto proibido" },
  { value: "COUNTERFEIT_PRODUCT", label: "Produto contrafeito" },
  { value: "INAPPROPRIATE_CONTENT", label: "Conteúdo impróprio" },
  { value: "HARASSMENT", label: "Assédio" },
  { value: "IMPERSONATION", label: "Falsificação de identidade" },
  { value: "OTHER", label: "Outro motivo" },
];

export default function ReportModal({
  open,
  targetType,
  targetId,
  onClose,
}: Props) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function submitReport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!reason || loading) return;

    try {
      setLoading(true);
      setError("");

      await api.post("/reports", {
        targetType,
        targetId,
        reason,
        description: description.trim(),
      });

      alert("Denúncia enviada com sucesso. Obrigado por nos ajudar!");

      setReason("");
      setDescription("");
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 409) {
        setError("Já fizeste uma denúncia ativa deste conteúdo.");
      } else if (status === 401) {
        setError("A tua sessão expirou. Inicia sessão novamente.");
      } else if (status === 404) {
        setError("O conteúdo que tentas denunciar já não está disponível.");
      } else {
        setError(
          err?.response?.data?.message ||
            "Não foi possível enviar a denúncia. Tenta novamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      className="report-overlay"
      onClick={onClose}
    >
      <div
        className="report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="report-modal-header">
          <div className="report-modal-heading">
            <div className="report-icon">
              <Flag size={20} />
            </div>

            <div>
              <h3 id="report-title">Denunciar conteúdo</h3>
              <p>Ajuda-nos a manter a comunidade segura.</p>
            </div>
          </div>

          <button
            type="button"
            className="report-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={submitReport}>
          <div className="report-modal-body">
            <div className="report-info">
              Seleciona o motivo que melhor descreve o problema.
              A nossa equipa irá analisar a denúncia.
            </div>

            <label className="report-field">
              <span>Motivo da denúncia</span>

              <select
                className="report-select"
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value as ReportReason)
                }
                required
              >
                <option value="">Seleciona um motivo</option>

                {reasons.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="report-field">
              <span>
                Descrição adicional
                <small> (opcional)</small>
              </span>

              <textarea
                className="report-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Explica, se necessário, o que aconteceu..."
              />

              <div className="report-counter">
                {description.length}/2000
              </div>
            </label>

            {error && (
              <div className="report-error">
                {error}
              </div>
            )}
          </div>

          <div className="report-modal-footer">
            <button
              type="button"
              className="report-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="report-submit"
              disabled={!reason || loading}
            >
              {loading ? (
                "A enviar..."
              ) : (
                <>
                  <Send size={15} />
                  Enviar denúncia
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}