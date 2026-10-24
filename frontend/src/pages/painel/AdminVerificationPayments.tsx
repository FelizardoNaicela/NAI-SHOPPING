import { ShieldCheck } from "lucide-react";

import { confirmVerificationPaymentByReference } from "../../services/adminVerificationPayments";

import PaymentConfirmCard from "./PaymentConfirmCard";

type AdminVerificationPaymentsProps = {
  isSuperAdmin: boolean;
};

export default function AdminVerificationPayments({
  isSuperAdmin,
}: AdminVerificationPaymentsProps) {
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <PaymentConfirmCard
      kind="VERIFICATION"
      title="Pagamentos de verificação"
      description="Confirmação manual (MOCK) através da referência."
      placeholder="Ex.: VERIFICATION-..."
      storageKey="adminPanel:verificationPayments"
      icon={<ShieldCheck size={20} strokeWidth={1.9} />}
      onConfirm={async reference => {
        const result =
          await confirmVerificationPaymentByReference(reference);

        return {
          message: result.alreadyPaid
            ? "Este pagamento já estava confirmado. A verificação foi validada."
            : "Pagamento confirmado e verificação aplicada com sucesso.",

          rows: [
            { label: "Banca", value: result.store.name },
            {
              label: "Tipo",
              value:
                result.request.requestedType === "PREMIUM"
                  ? "Premium"
                  : "Básica",
            },
            {
              label: "Estado do pagamento",
              value: result.payment.status,
            },
            {
              label: "Valor",
              value: `${result.payment.amount.toLocaleString("pt-MZ")} ${
                result.payment.currency
              }`,
            },
            {
              label: "Verificação",
              value: result.store.verified
                ? `Ativa — ${result.store.verificationType ?? "sem tipo"}`
                : "Não ativa",
            },
            {
              label: "Confirmado por",
              value:
                result.confirmedBy.name ?? result.confirmedBy.email ?? "—",
            },
          ],
        };
      }}
    />
  );
}