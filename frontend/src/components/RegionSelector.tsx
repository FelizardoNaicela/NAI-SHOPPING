
import { useState, useEffect } from "react";
import { REGIONS } from "../shared/regions";
import { useAuth } from "../auth/AuthProvider";

type Props = {
  onChange: () => void;
};

 export default function RegionSelector({ onChange }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [country, setCountry] = useState(
    () => localStorage.getItem("feed_country") || "MZ"
  );

  const [region, setRegion] = useState(
    () => localStorage.getItem("feed_region") || ""
  );

  const [collapsed, setCollapsed] = useState(true);

  const availableRegions =
    REGIONS[country as keyof typeof REGIONS] || [];

    useEffect(() => {
  if (!isAuthenticated || !user?.countryCode) return;

  setCountry(user.countryCode.trim().toUpperCase());
  setRegion(user.region?.trim() || "");
}, [
  isAuthenticated,
  user?.countryCode,
  user?.region,
]);

useEffect(() => {
    localStorage.setItem("feed_country", country);

    if (region === "") {
      localStorage.removeItem("feed_region");
    } else {
      localStorage.setItem("feed_region", region);
    }

    onChange();
  }, [country, region]);

  function handleCountryChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    setCountry(e.target.value);
    setRegion("");
  }

  function handleRegionChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    setRegion(e.target.value);
  }

  return (
    <div style={styles.container}>
      <button
        type="button"
        onClick={() => setCollapsed(prev => !prev)}
        aria-expanded={!collapsed}
        style={styles.toggle}
      >
        <span style={styles.toggleTitle}>
          <span>☷</span>
          Filtrar publicações
        </span>

        <span style={styles.toggleRight}>
          {collapsed ? "Mostrar" : "Ocultar"}
          <span style={styles.arrow}>
            {collapsed ? "⌄" : "⌃"}
          </span>
        </span>
      </button>

      {!collapsed && (
        <div style={styles.row}>
          <select
            value={country}
            onChange={handleCountryChange}
            style={styles.select}
          >
            <option value="MZ">Moçambique</option>
            <option value="BR">Brasil</option>
            <option value="PT">Portugal</option>
          </select>

          <select
            value={region}
            onChange={handleRegionChange}
            style={styles.select}
          >
            <option value="">Todas províncias</option>

            {availableRegions.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 12,
    borderRadius: 12,
    background: "var(--surface)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    marginBottom: 20,
  },

  toggle: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "5px 3px",
    border: "none",
    background: "transparent",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },

  toggleTitle: {
    display: "flex",
    alignItems: "center",
    gap: 9,
  },

  toggleRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 400,
  },

  arrow: {
    fontSize: 18,
  },

  row: {
    display: "flex",
    gap: 10,
    width: "100%",
    flexWrap: "wrap",
    marginTop: 14,
  },

  select: {
    flex: "1 1 160px",
    minWidth: 0,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface-secondary)",
    color: "var(--text)",
    boxSizing: "border-box",
  },
};