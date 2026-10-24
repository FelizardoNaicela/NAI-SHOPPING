import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const requestUrl = err.config?.url || "";

    // 401 no login significa apenas:
    // email/senha inválidos.
    // Não devemos apagar a sessão nem recarregar a página.
    if (
      status === 401 &&
      !requestUrl.includes("/auth/login")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("storeId");

      window.location.href = "/login";
    }

    return Promise.reject(err);
  },
);