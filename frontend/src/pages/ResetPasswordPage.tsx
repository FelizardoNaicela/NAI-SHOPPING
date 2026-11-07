
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import styles from "./ResetPasswordPage.module.css";

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationState = location.state as {
    email?: string;
  } | null;

  const [email, setEmail] = useState(navigationState?.email ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      setError("Introduz um código válido de seis dígitos.");
      return;
    }

    if (newPassword.length < 8) {
      setError("A nova palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email: normalizedEmail,
        code: normalizedCode,
        newPassword,
      });

      setSuccess("Palavra-passe alterada com sucesso! Já podes entrar na tua conta.");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            passwordReset: true,
            email: normalizedEmail,
          },
        });
      }, 1800);

    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Não foi possível alterar a palavra-passe. Verifica o código e tenta novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        <div className={styles.logo}>
          <h1>NAI</h1>
          <p>NAISHOPPING Marketplace</p>
        </div>

        <div className={styles.icon}>🔐</div>

        <h2 className={styles.title}>
          Criar nova palavra-passe
        </h2>

        <p className={styles.description}>
          Introduz o código de seis dígitos que recebeste
          por email e escolhe uma nova palavra-passe.
        </p>

        {success && (
          <div className={styles.success}>
            {success}
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <label className={styles.label}>
            Email
          </label>

          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email da tua conta"
            autoComplete="email"
            required
          />

          <label className={styles.label}>
            Código de recuperação
          </label>

          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={e =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            autoComplete="one-time-code"
            required
          />

          <label className={styles.label}>
            Nova palavra-passe
          </label>

          <input
            className={styles.input}
            type="password"
            placeholder="Introduz a nova palavra-passe"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <label className={styles.label}>
            Confirmar palavra-passe
          </label>

          <input
            className={styles.input}
            type="password"
            placeholder="Repete a nova palavra-passe"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <button
            className={styles.button}
            type="submit"
            disabled={loading || !!success}
          >
            {loading ? "A actualizar..." : "Alterar palavra-passe"}
          </button>

        </form>

        <Link to="/login" className={styles.back}>
          Voltar ao login
        </Link>

      </div>
    </div>
  );
}
