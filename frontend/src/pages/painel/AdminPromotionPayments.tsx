import { Megaphone } from "lucide-react";

import { confirmPromotionPaymentByReference } from "../../services/adminPromotionPayments";

import type { PainelProfile } from "./AdminManagement";
import PaymentConfirmCard from "./PaymentConfirmCard";

interface AdminPromotionPaymentsProps {
  profile: PainelProfile;
}

export default function AdminPromotionPayments({
  profile,
}: AdminPromotionPaymentsProps) {
  if (profile.adminRole !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <PaymentConfirmCard
      kind="PROMOTION"
      title="Pagamentos de promoção"
      description="Confirmação manual (MOCK) através da referência."
      placeholder="Ex.: PROMO-..."
      storageKey="adminPanel:promotionPayments"
      icon={<Megaphone size={20} strokeWidth={1.9} />}
      onConfirm={async reference => {
        const response =
          await confirmPromotionPaymentByReference(reference);

        const payment = response.payment;

        return {
          message:
            response.message || "Pagamento confirmado com sucesso.",

          rows: [
            { label: "Referência", value: payment.reference ?? "—" },
            {
              label: "Valor",
              value: `${payment.amount.toLocaleString("pt-PT")} ${
                payment.currency
              }`,
            },
            { label: "Estado", value: payment.status },
            { label: "Provedor", value: payment.provider ?? "—" },
            {
              label: "Confirmado em",
              value: payment.paidAt
                ? new Date(payment.paidAt).toLocaleString("pt-PT", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "—",
            },
            { label: "ID da promoção", value: payment.promotionId ?? "—" },
          ],
        };
      }}
    />
  );
}