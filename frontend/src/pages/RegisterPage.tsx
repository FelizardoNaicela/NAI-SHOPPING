import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { REGIONS, COUNTRIES } from "../shared/regions";



export default function RegisterPage() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    countryCode: "MZ",
    region: "",
  });

  const [availableRegions, setAvailableRegions] = useState<string[]>([]);

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // 🔥 Atualiza regiões quando país muda
  useEffect(() => {
setAvailableRegions(REGIONS[form.countryCode as keyof typeof REGIONS] || []);
  update("region", "");
}, [form.countryCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await api.post("/auth/register", form);
      alert("Conta criada com sucesso!");
      navigate("/login");
    } catch {
      alert("Erro ao criar conta");
    }
  }

  return (
    <div style={styles.container}>
      <h2>Criar Conta</h2>

      <form onSubmit={handleSubmit} style={styles.form}>

        <input
          placeholder="Nome"
          value={form.name}
          onChange={e => update("name", e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={e => update("email", e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Telefone"
          value={form.phone}
          onChange={e => update("phone", e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Senha"
          value={form.password}
          onChange={e => update("password", e.target.value)}
          style={styles.input}
        />

        <div style={styles.row}>
          <select
  style={styles.select}
  value={form.countryCode}
  onChange={(e) => update("countryCode", e.target.value)}
>
  {COUNTRIES.map(c => (
    <option key={c.code} value={c.code}>
      {c.name}
    </option>
  ))}
</select>

          <select
            style={styles.select}
  value={form.region}
  onChange={(e) => update("region", e.target.value)}
>
  <option value="">Selecionar província</option>

  {availableRegions.map(r => (
    <option key={r} value={r}>
      {r}
    </option>
  ))}
</select>
        </div>

        <button style={styles.button}>
          Criar conta
        </button>

      </form>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: 400,
    margin: "60px auto",
    padding: 20,
    borderRadius: 12,
    background: "#1e1e1e",
    color: "white",
  },
  form: {
    display: "flex",
    flexDirection: "column", // ✅ agora aceito
    gap: 12,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: "none",
    background: "#2a2a2a",
    color: "white",
  },
  row: {
    display: "flex",
    gap: 10,
  },
  select: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "none",
    background: "#2a2a2a",
    color: "white",
  },
  button: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "#4CAF50",
    color: "white",
    cursor: "pointer",
    marginTop: 10,
  },
};