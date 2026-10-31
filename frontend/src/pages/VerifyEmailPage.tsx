
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [message, setMessage] = useState(
    "A confirmar o teu endereço de email..."
  );

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("O link não contém um token de confirmação.");
        return;
      }

      try {
        const response = await api.post("/auth/verify-email", {
          token,
        });

        if (!active) return;

        setStatus("success");
        setMessage(
          response.data?.message ||
            "Email confirmado com sucesso. Já podes iniciar sessão."
        );
      } catch (error: any) {
        if (!active) return;

        setStatus("error");
        setMessage(
          error?.response?.data?.message ||
            "Não foi possível confirmar o email. O link pode ter expirado."
        );
      }
    }

    void verify();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Confirmação de email</h2>

        <p
          style={{
            ...styles.message,
            color:
              status === "success"
                ? "#4ade80"
                : status === "error"
                  ? "#f87171"
                  : "#d1d5db",
          }}
        >
          {status === "loading" ? "⏳ " : ""}
          {status === "success"
            ? "✓ "
            : status === "error"
              ? "✕ "
              : ""}
          {message}
        </p>

        {status !== "loading" && (
          <Link to="/login" style={styles.button}>
            Ir para iniciar sessão
          </Link>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: 24,
    borderRadius: 12,
    background: "#1e1e1e",
    color: "white",
    textAlign: "center",
  },
  message: {
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },
  button: {
    display: "inline-block",
    marginTop: 12,
    padding: "12px 18px",
    borderRadius: 8,
    background: "#4CAF50",
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
  },
};
