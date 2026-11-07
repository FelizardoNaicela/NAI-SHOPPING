
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import styles from "./ForgotPasswordPage.module.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      await api.post("/auth/forgot-password", {
        email: normalizedEmail,
      });

      setMessage(
        "Se existir uma conta associada a este email, receberás um código de recuperação."
      );

      // Encaminha para a página de introdução do código.
      navigate("/reset-password", {
        state: {
          email: normalizedEmail,
        },
      });

    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Não foi possível processar o pedido. Tenta novamente."
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

        <div className={styles.icon}>
          🔐
        </div>

        <h2 className={styles.title}>
          Recuperar palavra-passe
        </h2>

        <p className={styles.description}>
          Introduz o email associado à tua conta.
          Enviaremos um código de seis dígitos para
          poderes criar uma nova palavra-passe.
        </p>

        {message && (
          <div className={styles.success}>
            {message}
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
            placeholder="exemplo@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <button
            className={styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? "A enviar..." : "Enviar código"}
          </button>

        </form>

        <Link to="/login" className={styles.back}>
          Voltar ao login
        </Link>

      </div>
    </div>
  );
}
