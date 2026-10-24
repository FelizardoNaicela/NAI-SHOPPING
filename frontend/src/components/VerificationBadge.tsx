import { BadgeCheck } from "lucide-react";
import styles from "./VerificationBadge.module.css";

type Props = {
  type?: string | null;
  verified?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

const SIZE = { sm: 14, md: 18, lg: 24 } as const;

export default function VerificationBadge({
  type,
  verified,
  size = "md",
  showLabel = false,
}: Props) {
  const kind =
    type === "PREMIUM"
      ? "PREMIUM"
      : type === "BASIC" || verified
        ? "BASIC"
        : null;

  if (!kind) return null;

  const full = kind === "PREMIUM" ? "Verificação Premium" : "Verificação Básica";
  const label = kind === "PREMIUM" ? "Premium" : "Verificada";

  return (
    <span
      className={`${styles.badge} ${
        kind === "PREMIUM" ? styles.premium : styles.basic
      } ${showLabel ? styles.pill : ""}`}
      title={full}
      aria-label={full}
    >
      <BadgeCheck size={SIZE[size]} strokeWidth={2.2} className={styles.icon} />
      {showLabel && label}
    </span>
  );
}