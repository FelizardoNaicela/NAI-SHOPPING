
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

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
   const [success, setSuccess] = useState("");
  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    setAvailableRegions(
      REGIONS[form.countryCode as keyof typeof REGIONS] || []
    );

    setForm((prev) => ({ ...prev, region: "" }));
  }, [form.countryCode]);

  const passwordsMatch =
    confirmPassword.length > 0 && form.password === confirmPassword;

  // =====================================================
  // REGISTO DIRECTO
  // =====================================================

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (form.password !== confirmPassword) {
      setError("As senhas não coincidem. Verifica a confirmação.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        ...form,
        email: form.email.trim().toLowerCase(),
      });

      setSuccess(
        response?.data?.message ||
          "Conta criada com sucesso. Já podes iniciar sessão."
      );

      // Pequena pausa para apresentar a mensagem de sucesso.
      setTimeout(() => {
        navigate("/login", {
          state: {
            registered: true,
            email: form.email.trim().toLowerCase(),
          },
        });
      }, 1200);
    } catch (err: any) {
      const message = err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(" ")
          : message ||
              "Não foi possível criar a conta. Tenta novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Criar Conta</h2>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          style={styles.input}
          autoComplete="name"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          style={styles.input}
          autoComplete="email"
          required
        />

        <input
          type="tel"
          placeholder="Telefone"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          style={styles.input}
          autoComplete="tel"
        />

        <div style={styles.passwordContainer}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Senha (mínimo 8 caracteres)"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            style={styles.passwordInput}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <button
            type="button"
            style={styles.toggleButton}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        <div style={styles.passwordContainer}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.passwordInput}
            autoComplete="new-password"
            required
          />

          <button
            type="button"
            style={styles.toggleButton}
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={
              showConfirmPassword
                ? "Ocultar confirmação da senha"
                : "Mostrar confirmação da senha"
            }
          >
            {showConfirmPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        {confirmPassword.length > 0 && (
          <p
            style={{
              ...styles.passwordFeedback,
              color: passwordsMatch ? "#4ade80" : "#f87171",
            }}
          >
            {passwordsMatch
              ? "✓ As senhas coincidem."
              : "✗ As senhas não coincidem."}
          </p>
        )}

        <div style={styles.row}>
          <select
            style={styles.select}
            value={form.countryCode}
            onChange={(e) => update("countryCode", e.target.value)}
            required
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>

          <select
            style={styles.select}
            value={form.region}
            onChange={(e) => update("region", e.target.value)}
          >
            <option value="">Selecionar província</option>

            {availableRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
          }}
          disabled={loading}
        >
          {loading ? "A criar conta..." : "Criar conta"}
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
  title: {
    marginTop: 0,
    marginBottom: 20,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    boxSizing: "border-box",
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "none",
    background: "#2a2a2a",
    color: "white",
  },
  passwordContainer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 8px 0 10px",
    borderRadius: 8,
    background: "#2a2a2a",
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    padding: "10px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "white",
  },
  toggleButton: {
    border: "none",
    background: "transparent",
    color: "#86efac",
    cursor: "pointer",
    padding: "8px 0",
    fontSize: 12,
    fontWeight: "bold",
  },
  passwordFeedback: {
    margin: "-4px 0 0",
    fontSize: 13,
  },
  row: {
    display: "flex",
    gap: 10,
  },
  select: {
    boxSizing: "border-box",
    minWidth: 0,
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
    fontWeight: "bold",
  },

  error: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    background: "#451a1a",
    color: "#fca5a5",
    fontSize: 14,
  },
  success: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    background: "#14532d",
    color: "#bbf7d0",
    fontSize: 14,
  },
};
