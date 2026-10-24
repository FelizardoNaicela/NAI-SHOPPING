import { useState, useEffect } from "react";
import { REGIONS} from "../shared/regions";


type Props = {
  onChange: () => void;
};

export default function RegionSelector({ onChange }: Props) {

  const [country, setCountry] = useState(
    localStorage.getItem("feed_country") || "MZ"
  );

  const [region, setRegion] = useState(
    localStorage.getItem("feed_region") || ""
  );

  const [availableRegions, setAvailableRegions] = useState<string[]>([]);

  useEffect(() => {
setAvailableRegions(REGIONS[country as keyof typeof REGIONS] || []);
    setRegion("");
  }, [country]);

  useEffect(() => {

    localStorage.setItem("feed_country", country);

    if (region === "") {
        localStorage.removeItem("feed_region");
    } else {
        localStorage.setItem("feed_region", region);
    }

    onChange();

}, [country, region]);

 const handleCountryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
) => {

    const newCountry = e.target.value;

    setCountry(newCountry);

    setAvailableRegions(
        REGIONS[newCountry as keyof typeof REGIONS] || []
    );

    setRegion("");

};

const handleRegionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
) => {

    setRegion(e.target.value);

};

  return (
    <div style={styles.container}>
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
          {availableRegions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

      </div>

    </div>
  );
}

const styles = {
  container: {
    padding: 16,
    borderRadius: 12,
    background: "#1e1e1e",
    color: "white",
    marginBottom: 20,
  },
  header: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  row: {
  display: "flex",
  gap: 10,
  width: "100%",
  flexWrap: "wrap" as const,
},
  select: {
  flex: "1 1 160px",
  minWidth: 0,
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  boxSizing: "border-box" as const,
},
  buttons: {
    display: "flex",
    gap: 10,
    marginTop: 12,
  },
};