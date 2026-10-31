
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

  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);

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

  // REGISTO
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
      const response = await api.post("/auth/register", form);

      const normalizedEmail = form.email.trim().toLowerCase();

      setVerificationEmail(normalizedEmail);
      setVerificationCode("");
      setVerificationMode(true);

      setSuccess(
        response?.data?.message ||
          "Enviámos um email com o link e o código de confirmação."
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Não foi possível iniciar o registo. Tenta novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  // CONFIRMAÇÃO PELO CÓDIGO DE SEIS DÍGITOS
  async function handleVerifyEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const normalizedCode = verificationCode.trim();

    if (!verificationEmail.trim()) {
      setError("O endereço de email é obrigatório.");
      return;
    }

    if (!/^\d{6}$/.test(normalizedCode)) {
      setError("Introduz um código válido de seis dígitos.");
      return;
    }

    setVerifying(true);

    try {
      const response = await api.post("/auth/verify-email-code", {
        email: verificationEmail.trim().toLowerCase(),
        code: normalizedCode,
      });

      setSuccess(
        response?.data?.message ||
          "Email confirmado com sucesso!"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      const message = err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(" ")
          : message ||
              "Não foi possível confirmar o email. Verifica o código e tenta novamente."
      );
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        {verificationMode ? "Confirmar email" : "Criar Conta"}
      </h2>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {!verificationMode ? (
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
            {loading ? "A enviar confirmação..." : "Criar conta"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyEmail} style={styles.form}>
          <p style={styles.description}>
            Enviámos um email para:
          </p>

          <p style={styles.verificationEmail}>
            {verificationEmail}
          </p>

          <p style={styles.description}>
            Clica no link recebido ou introduz aqui o código de seis dígitos.
          </p>

          <label style={styles.label}>
            Código de confirmação
          </label>

          <input
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) =>
              setVerificationCode(
                e.target.value.replace(/\D/g, "").slice(0, 6)
              )
            }
            style={styles.codeInput}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
          />

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: verifying ? 0.7 : 1,
            }}
            disabled={verifying}
          >
            {verifying ? "A confirmar..." : "Confirmar email"}
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => {
              setVerificationMode(false);
              setVerificationCode("");
              setError("");
              setSuccess("");
            }}
          >
            Voltar ao registo
          </button>
        </form>
      )}
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
  secondaryButton: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #555",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
  description: {
    margin: "0 0 4px",
    lineHeight: 1.5,
    color: "#d1d5db",
    fontSize: 14,
  },
  verificationEmail: {
    margin: "0 0 8px",
    color: "#86efac",
    fontWeight: "bold",
    overflowWrap: "anywhere",
  },
  codeInput: {
    boxSizing: "border-box",
    width: "100%",
    padding: 14,
    borderRadius: 8,
    border: "1px solid #4b5563",
    background: "#2a2a2a",
    color: "white",
    textAlign: "center",
    fontSize: 25,
    fontWeight: "bold",
    letterSpacing: 8,
  },
  label: {
    fontSize: 13,
    color: "#d1d5db",
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
