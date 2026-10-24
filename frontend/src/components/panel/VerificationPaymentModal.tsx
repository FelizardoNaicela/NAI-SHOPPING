import { useEffect, useRef, useState } from "react";
import { Check, Copy, Info, X } from "lucide-react";

import type { PaymentMethod } from "../../pages/pagamentos/PaymentMethodSelector";
import styles from "./VerificationPaymentModal.module.css";

type MethodOption = {
  id: PaymentMethod;
  label: string;
  caption: string;
  hint: string;
  logo?: string;
  badge?: string;
  badgeClass?: string;
  available: boolean;
};

const METHODS: MethodOption[] = [
  {
    id: "MPESA" as PaymentMethod,
    label: "M-Pesa",
    caption: "Vodacom",
    hint: "Pagamento por M-Pesa ainda não está disponível.",
    logo: "/payments/mpesa.png",
    badge: "M-PESA",
    badgeClass: styles.badgeMpesa,
    available: false,
  },
  {
    id: "EMOLA" as PaymentMethod,
    label: "e-Mola",
    caption: "Movitel",
hint: "Pague com a referência e aguarde a confirmação.",
    logo: "/payments/emola.png",
    badge: "e-Mola",
    badgeClass: styles.badgeEmola,
    available: false,
  },
  {
    id: "MOCK",
    label: "Pagamento manual",
    caption: "Usar a referência",
    hint: "Pague com a referência acima e aguarde a confirmação.",
    badge: "REF",
    badgeClass: styles.badgeManual,
    available: true,
  },
];

function MethodLogo({ method }: { method: MethodOption }) {
  const [failed, setFailed] = useState(false);

  if (method.logo && !failed) {
    return (
      <img
        src={method.logo}
        alt={method.label}
        className={styles.logoImg}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`${styles.logoBadge} ${method.badgeClass ?? ""}`}>
      {method.badge ?? method.label}
    </span>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  verificationLabel: string;
  reference?: string;
  amount: string;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  onContinue: () => void;
  loading?: boolean;
};

export default function VerificationPaymentModal({
  open,
  onClose,
  verificationLabel,
  reference = "",
  amount,
  method,
  onMethodChange,
  onContinue,
  loading = false,
}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  function showToast(message: string) {
    if (timer.current) window.clearTimeout(timer.current);

    setToast(message);

    timer.current = window.setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(reference);
      showToast("Referência copiada.");
    } catch {
      showToast("Não foi possível copiar.");
    }
  }

  function selectMethod(option: MethodOption) {
    if (!option.available) {
      showToast(option.hint);
      return;
    }

    onMethodChange(option.id);
  }

  const selected = METHODS.find(m => m.id === method);
  const canContinue = Boolean(selected?.available);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Pagamento da verificação"
        onClick={e => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2>Pagar verificação</h2>
            <span className={styles.subtitle}>{verificationLabel}</span>
          </div>

          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        {/* FATURA */}

        <div className={styles.invoice}>
          <div className={styles.amountBlock}>
            <span>Total a pagar</span>
            <strong>{amount}</strong>
          </div>

          {reference && (
  <button
    type="button"
    className={styles.reference}
    onClick={copyReference}
    title="Copiar referência"
  >
    <span className={styles.referenceLabel}>Referência</span>
    <span className={styles.referenceValue}>{reference}</span>
    <Copy size={15} strokeWidth={2} />
  </button>
)}
        </div>

        {/* MÉTODOS */}

        <div className={styles.methods}>
          {METHODS.map(option => {
            const isSelected = option.id === method && option.available;

            return (
              <button
                key={option.id}
                type="button"
                className={`${styles.method} ${
                  isSelected ? styles.methodSelected : ""
                } ${!option.available ? styles.methodMuted : ""}`}
                onClick={() => selectMethod(option)}
                aria-pressed={isSelected}
              >
                <span className={styles.logoBox}>
                  <MethodLogo method={option} />
                </span>

                <span className={styles.methodText}>
                  <strong>{option.label}</strong>
                  <small>{option.caption}</small>
                </span>

                <span className={styles.methodEnd}>
                  {!option.available && (
                    <span className={styles.soon}>Em breve</span>
                  )}

                  {isSelected ? (
                    <span className={styles.check}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      className={styles.infoDot}
                      role="button"
                      tabIndex={0}
                      aria-label={`Informação sobre ${option.label}`}
                      onClick={e => {
                        e.stopPropagation();
                        showToast(option.hint);
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          showToast(option.hint);
                        }
                      }}
                    >
                      <Info size={15} strokeWidth={2} />
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* AÇÕES */}

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.secondary}
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
  type="button"
  className={styles.primary}
  disabled={!canContinue || loading}
  onClick={onContinue}
>
  {loading ? "A iniciar..." : "Continuar"}
</button>
        </footer>

        {/* AVISO TEMPORÁRIO */}

        <div
          className={`${styles.toast} ${toast ? styles.toastVisible : ""}`}
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      </div>
    </div>
  );
}