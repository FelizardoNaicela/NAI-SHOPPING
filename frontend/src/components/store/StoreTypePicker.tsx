import { STORE_TYPES, type StoreType } from "../../shared/storeTypes";
import styles from "./StoreTypePicker.module.css";

type Props = { value: StoreType; onChange: (value: StoreType) => void };

export default function StoreTypePicker({ value, onChange }: Props) {
  return (
    <div className={styles.grid} role="radiogroup" aria-label="Tipo de estabelecimento">
      {STORE_TYPES.map(({ value: option, label, hint, Icon }) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          className={`${styles.item} ${value === option ? styles.active : ""}`}
          onClick={() => onChange(option)}
        >
          <Icon size={20} strokeWidth={1.9} />
          <strong>{label}</strong>
          <small>{hint}</small>
        </button>
      ))}
    </div>
  );
}