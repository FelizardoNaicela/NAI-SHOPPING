import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
} from "lucide-react";

import PanelSection from "../../components/panel/PanelSection";

import {
  lookupPaymentByReference,
  type PaymentLookup,
} from "../../services/adminPaymentLookup";

import styles from "./PaymentConfirmCard.module.css";

export type ConfirmOutcome = {
  message: string;
  rows: { label: string; value: string }[];
};

type Props = {
  kind: "VERIFICATION" | "PROMOTION";
  title: string;
  description: string;
  placeholder: string;
  storageKey: string;
  icon: ReactNode;
  onConfirm: (reference: string) => Promise<ConfirmOutcome>;
};

type Preview =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; data: PaymentLookup }
  | { status: "notFound" }
  | { status: "unavailable" };

const TYPE_LABEL: Record<PaymentLookup["type"], string> = {
  VERIFICATION: "Verificação",
  PROMOTION: "Promoção",
  NATIONAL_RANKING: "Ranking nacional",
  OTHER: "Outro",
};

const STATUS_LABEL: Record<PaymentLookup["status"], string> = {
  PENDING: "Pendente",
  PAID: "Já pago",
  FAILED: "Falhado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

function money(amount: number, currency: string) {
  return `${amount.toLocaleString("pt-MZ")} ${currency}`;
}

function date(value?: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("pt-MZ", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function describeSubject(payment: PaymentLookup) {
  if (payment.verification) {
    return `Verificação ${
      payment.verification.requestedType === "PREMIUM"
        ? "Premium"
        : "Básica"
    }`;
  }

  if (payment.promotion) {
    return `Promoção “${payment.promotion.name}”`;
  }

  return payment.description ?? TYPE_LABEL[payment.type];
}

export default function PaymentConfirmCard({
  kind,
  title,
  description,
  placeholder,
  storageKey,
  icon,
  onConfirm,
}: Props) {
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<ConfirmOutcome | null>(null);
  const [preview, setPreview] = useState<Preview>({ status: "idle" });

  // ---------- Pré-visualização enquanto se escreve ----------

  useEffect(() => {
    const value = reference.trim();

    if (value.length < 4) {
      setPreview({ status: "idle" });
      return;
    }

    let cancelled = false;

    setPreview({ status: "loading" });

    const timer = window.setTimeout(async () => {
      try {
        const data = await lookupPaymentByReference(value);

        if (!cancelled) {
          setPreview({ status: "found", data });
        }
      } catch (err: any) {
        if (cancelled) {
          return;
        }

        const status = err?.response?.status;
        const message = String(err?.response?.data?.message ?? "");

        // "Cannot GET ..." significa que a rota ainda não existe.
        if (status === 404 && !message.startsWith("Cannot")) {
          setPreview({ status: "notFound" });
        } else {
          setPreview({ status: "unavailable" });
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reference]);

  // ---------- Regras ----------

  const found = preview.status === "found" ? preview.data : null;

  const wrongType = Boolean(found && found.type !== kind);

  const notConfirmable = Boolean(
    found && found.status !== "PENDING" && found.status !== "PAID",
  );

  const blocked =
    preview.status === "notFound" || wrongType || notConfirmable;

  const canSubmit =
    Boolean(reference.trim()) &&
    !loading &&
    !blocked &&
    preview.status !== "loading";

  // ---------- Confirmar ----------

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const value = reference.trim();

    if (!value || !canSubmit) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setOutcome(null);

      const result = await onConfirm(value);

      setOutcome(result);
      setReference("");
    } catch (err: any) {

      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Não foi possível confirmar o pagamento.";

      setError(
        Array.isArray(message) ? message.join(", ") : String(message),
      );
    } finally {
      setLoading(false);
    }
  }

  const submitLabel = loading
    ? "A confirmar..."
    : found && found.status === "PENDING"
      ? `Confirmar ${money(found.amount, found.currency)}`
      : "Confirmar pagamento";

  return (
    <PanelSection
      title={title}
      description={description}
      icon={icon}
      storageKey={storageKey}
      summary={<span className={styles.superBadge}>SUPER ADMIN</span>}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${storageKey}-ref`}>
            Referência do pagamento
          </label>

          <input
            id={`${storageKey}-ref`}
            className={styles.input}
            type="text"
            value={reference}
            onChange={event => {
              setReference(event.target.value);
              setOutcome(null);
              setError("");
            }}
            placeholder={placeholder}
            disabled={loading}
            autoComplete="off"
          />

          <p className={styles.helper}>
            Os detalhes aparecem ao escrever. Nada é confirmado até
            clicar no botão.
          </p>
        </div>

        <button type="submit" className={styles.submit} disabled={!canSubmit}>
          {submitLabel}
        </button>
      </form>

      {/* PRÉ-VISUALIZAÇÃO */}

      {preview.status === "loading" && (
        <div className={styles.hint}>
          <RefreshCw size={14} className={styles.spin} />
          A procurar a referência...
        </div>
      )}

      {preview.status === "notFound" && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <AlertTriangle size={16} />
          Nenhum pagamento encontrado com esta referência.
        </div>
      )}

      {preview.status === "unavailable" && (
        <div className={`${styles.alert} ${styles.alertInfo}`}>
          <Info size={16} />
          Não foi possível pré-visualizar esta referência. Ainda pode
          confirmar, mas sem ver os detalhes antes.
        </div>
      )}

      {found && (
        <div className={styles.preview}>
          <div className={styles.previewHead}>
            <div>
              <span className={styles.previewLabel}>
                A confirmar
              </span>
              <strong className={styles.previewSubject}>
                {describeSubject(found)}
              </strong>
            </div>

            <div className={styles.badges}>
              <span className={styles.pill}>{TYPE_LABEL[found.type]}</span>
              <span
                className={`${styles.pill} ${styles[`pill${found.status}`]}`}
              >
                {STATUS_LABEL[found.status]}
              </span>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.item}>
              <span>Valor</span>
              <strong className={styles.amount}>
                {money(found.amount, found.currency)}
              </strong>
            </div>

            <div className={styles.item}>
              <span>Banca</span>
              <strong>{found.store?.name ?? "—"}</strong>
            </div>

            <div className={styles.item}>
              <span>Pago por</span>
              <strong>
                {found.payer?.name ?? found.payer?.email ?? "—"}
              </strong>
            </div>

            <div className={styles.item}>
              <span>Criado em</span>
              <strong>{date(found.createdAt)}</strong>
            </div>

            <div className={styles.item}>
              <span>Provedor</span>
              <strong>{found.provider ?? "—"}</strong>
            </div>

            {found.paidAt && (
              <div className={styles.item}>
                <span>Pago em</span>
                <strong>{date(found.paidAt)}</strong>
              </div>
            )}
          </div>

          {wrongType && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <AlertTriangle size={16} />
              Esta referência pertence a um pagamento de{" "}
              {TYPE_LABEL[found.type].toLowerCase()}. Use a área
              correspondente.
            </div>
          )}

          {!wrongType && notConfirmable && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <AlertTriangle size={16} />
              Este pagamento está “{STATUS_LABEL[found.status]}” e não
              pode ser confirmado.
            </div>
          )}

          {!wrongType && found.status === "PAID" && (
            <div className={`${styles.alert} ${styles.alertWarn}`}>
              <Info size={16} />
              Este pagamento já foi confirmado. Confirmar de novo não
              duplica nada.
            </div>
          )}
        </div>
      )}

      {/* ERRO */}

      {error && (
        <div role="alert" className={`${styles.alert} ${styles.alertError}`}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* RESULTADO */}

      {outcome && (
        <div className={styles.result}>
          <div role="status" className={`${styles.alert} ${styles.alertSuccess}`}>
            <CheckCircle2 size={16} />
            {outcome.message}
          </div>

          <div className={styles.grid}>
            {outcome.rows.map(row => (
              <div key={row.label} className={styles.item}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </PanelSection>
  );
}