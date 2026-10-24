import { getStoreType } from "../../shared/storeTypes";
import styles from "./StoreTypeBadge.module.css";

export default function StoreTypeBadge({ type }: { type?: string | null }) {
  const { label, Icon } = getStoreType(type);

  return (
    <span className={styles.badge}>
      <Icon size={13} strokeWidth={2} />
      {label}
    </span>
  );
}