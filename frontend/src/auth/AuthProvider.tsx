import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { api } from "../services/api";
import { createSocket, disconnectSocket } from "../socket/socket";

type AuthContextType = {
  token: string |null;
  user: any | null;

  isAuthenticated: boolean;

  login: (
    token: string,
    user: any,
  ) => void;

  logout: () => void;

  refreshUser: () => Promise<void>;

  setUser: React.Dispatch<
    React.SetStateAction<any | null>
  >;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔥 hidratação imediata
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const [user, setUser] = useState<any | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        // 🔥 socket já conecta cedo (evita atraso no chat)
        createSocket(token);

        const res = await api.get("/auth/me");

        if (!mounted) return;

const normalizedUser = {
  ...res.data,
  id: res.data.id || res.data.sub,
};

setUser(normalizedUser);

localStorage.setItem(
  "user",
  JSON.stringify(normalizedUser)
);
        // opcional store
        try {
          const storeRes = await api.get("/stores/me");
          if (storeRes.data) {
            localStorage.setItem("storeId", storeRes.data.id);
          }
        } catch {}

      } catch (err) {
        logout();
        return;
      }

      if (mounted) setLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [token]);

 async function refreshUser() {
  if (!token) return;

  const res = await api.get("/auth/me");

  setUser({
    ...res.data,
    id: res.data.id || res.data.sub,
  });

  localStorage.setItem(
    "user",
    JSON.stringify({
      ...res.data,
      id: res.data.id || res.data.sub,
    })
  );
}

  function login(token: string, user: any) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setToken(token);
    setUser(user);

    createSocket(token);

    if (user?.storeId) {
      localStorage.setItem("storeId", user.storeId);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("storeId");

    disconnectSocket();

    setToken(null);
    setUser(null);

    window.location.href = "/";
  }

  // 🔥 NÃO trava o app inteiro
  if (loading && !user) {
    return <div>Carregando...</div>;
  }
return(
  <AuthContext.Provider
    value={{
        token,
        user,
        isAuthenticated: !!token,
        login,
        logout,
        refreshUser,
        setUser,
   }}
>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return ctx;
}