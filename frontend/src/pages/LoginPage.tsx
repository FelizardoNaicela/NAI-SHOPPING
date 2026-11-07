
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../services/api";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const registrationState = location.state as {
    registered?: boolean;
    email?: string;
  } | null;

  const loginState = location.state as {
  registered?: boolean;
  email?: string;
  passwordReset?: boolean;
} | null;

  const [email, setEmail] = useState(registrationState?.email ?? "");
  const [password, setPassword] = useState("");

  const { login } = useAuth();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { accessToken, user } = res.data;

      login(accessToken, user);

      // Salva storeId também
      if (user.storeId) {
        localStorage.setItem("storeId", user.storeId);
      }

      navigate("/");
    } catch {
      alert("Credenciais inválidas");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        <div className={styles.logo}>
          <h1>NAI</h1>
          <p>NAISHOPPING Marketplace</p>
        </div>

        {registrationState?.registered && (
          <div className={styles.success}>
            Conta criada com sucesso! Já podes entrar na tua conta.
          </div>
        )}

        {loginState?.passwordReset && (
  <div className={styles.success}>
    Palavra-passe alterada com sucesso! Entra com a tua nova senha.
  </div>
)}

        <form onSubmit={handleLogin}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            className={styles.input}
            type="password"
            placeholder="Palavra-passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <div className={styles.forgotPassword}>
            <Link to="/forgot-password">
              Esqueci-me da senha
            </Link>
          </div>

          <button className={styles.button} type="submit">
            Entrar
          </button>

          <div
            className={styles.register}
            onClick={() => navigate("/register")}
          >
            Criar conta
          </div>
        </form>

      </div>
    </div>
  );
}
