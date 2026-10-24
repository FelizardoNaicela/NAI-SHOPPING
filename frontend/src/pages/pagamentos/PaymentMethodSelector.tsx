import {
  Check,
  CircleDollarSign,
  Smartphone,
} from "lucide-react";

import styles from "./PaymentMethodSelector.module.css";

export type PaymentMethod =
  | "MPESA"
  | "EMOLA"
  | "MOCK";

type PaymentMethodSelectorProps = {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
};

type PaymentMethodOption = {
  id: PaymentMethod;
  name: string;
  description: string;
  unavailable?: boolean;
};

const paymentMethods: PaymentMethodOption[] = [
  {
    id: "MPESA",
    name: "M-Pesa",
    description:
      "Pagamento automático através do M-Pesa.",
    unavailable: true,
  },
  {
    id: "EMOLA",
    name: "e-Mola",
    description:
      "Pagamento automático através do e-Mola.",
    unavailable: true,
  },
  {
    id: "MOCK",
    name: "Pagamento manual",
    description:
      "O pagamento será analisado e confirmado por um administrador autorizado.",
  },
];

export default function PaymentMethodSelector({
  value,
  onChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <CircleDollarSign size={20} />
        </div>

        <div>
          <h3 className={styles.title}>
            Método de pagamento
          </h3>

          <p className={styles.description}>
            Escolha como deseja realizar o pagamento.
          </p>
        </div>
      </div>

      <div className={styles.methods}>
        {paymentMethods.map((method) => {
          const selected =
            value === method.id;

          const unavailable =
            method.unavailable === true;

          const isDisabled =
            disabled || unavailable;

          return (
            <button
              key={method.id}
              type="button"
              className={[
                styles.method,
                selected
                  ? styles.methodSelected
                  : "",
                unavailable
                  ? styles.methodUnavailable
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (isDisabled) {
                  return;
                }

                onChange(method.id);
              }}
              disabled={isDisabled}
              aria-pressed={selected}
            >
              <div
                className={[
                  styles.methodIcon,
                  styles[`methodIcon${method.id}`],
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {method.id === "MPESA" && (
                  <span className={styles.mpesaLogo}>
                    M
                  </span>
                )}

                {method.id === "EMOLA" && (
                  <span className={styles.emolaLogo}>
                    e
                  </span>
                )}

                {method.id === "MOCK" && (
                  <Smartphone size={22} />
                )}
              </div>

              <div
                className={
                  styles.methodContent
                }
              >
                <div
                  className={
                    styles.methodTop
                  }
                >
                  <span
                    className={
                      styles.methodName
                    }
                  >
                    {method.name}
                  </span>

                  {unavailable ? (
                    <span
                      className={
                        styles.unavailableBadge
                      }
                    >
                      Ainda não disponível
                    </span>
                  ) : (
                    <span
                      className={
                        styles.availableBadge
                      }
                    >
                      Disponível
                    </span>
                  )}
                </div>

                <span
                  className={
                    styles.methodDescription
                  }
                >
                  {method.description}
                </span>
              </div>

              <div
                className={[
                  styles.check,
                  selected
                    ? styles.checkSelected
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {selected && (
                  <Check size={16} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {value === "MOCK" && (
        <div className={styles.manualNotice}>
          <div
            className={styles.manualNoticeIcon}
          >
            <Smartphone size={17} />
          </div>

          <div>
            <strong>
              Pagamento manual
            </strong>

            <p>
              O pedido será encaminhado para
              aprovação manual. Para evitar
              atrasos, certifique-se de que o
              pagamento possa ser confirmado por
              um administrador autorizado.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}