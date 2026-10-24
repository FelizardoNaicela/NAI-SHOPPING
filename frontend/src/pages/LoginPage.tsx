import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../services/api";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { login } = useAuth(); // 👈 AQUI

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { accessToken, user } = res.data;

      login(accessToken, user); // 👈 SALVA NO CONTEXTO

      // salva storeId também
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

        <form onSubmit={handleLogin}>

            <input
                className={styles.input}
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />

            <input
                className={styles.input}
                type="password"
                placeholder="Palavra-passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />

            <button className={styles.button}>
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