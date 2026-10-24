import { REGIONS } from "../../shared/regions";
import styles from "./MarketplaceFilters.module.css";

export type MarketplaceFiltersValue = {
  country: string;
  region: string;
  time: string;
  sort: string;
  type: string;
};

type Props = {
  value: MarketplaceFiltersValue;
  onChange(value: MarketplaceFiltersValue): void;
};

export default function MarketplaceFilters({ value, onChange }: Props) {
  const availableRegions =
    REGIONS[value.country as keyof typeof REGIONS] || [];

  function update(changes: Partial<MarketplaceFiltersValue>) {
    onChange({ ...value, ...changes });
  }

  return (
    <div className={styles.filters}>
      {/* País */}
      <select
        className={styles.select}
        value={value.country}
        onChange={e => update({ country: e.target.value, region: "" })}
      >
        <option value="MZ">Moçambique</option>
        <option value="BR">Brasil</option>
        <option value="PT">Portugal</option>
      </select>

      {/* Região */}
      <select
        className={styles.select}
        value={value.region}
        onChange={e => update({ region: e.target.value })}
      >
        <option value="">Todas províncias</option>

        {availableRegions.map(r => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      {/* Tempo */}
      <select
        className={styles.select}
        value={value.time}
        onChange={e => update({ time: e.target.value })}
      >
        <option value="all">Qualquer data</option>
        <option value="today">Hoje</option>
        <option value="7d">Últimos 7 dias</option>
        <option value="30d">Últimos 30 dias</option>
        <option value="6m">Últimos 6 meses</option>
      </select>

      {/* Ordenação */}
      <select
        className={styles.select}
        value={value.sort}
        onChange={e => update({ sort: e.target.value })}
      >
        <option value="recent">Relevância</option>
        <option value="priceAsc">Menor preço</option>
        <option value="priceDesc">Maior preço</option>
      </select>
    </div>
  );
}