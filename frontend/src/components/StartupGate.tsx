
import "./StartupGate.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { Network } from "@capacitor/network";

type StartupStatus =
  | "checking"
  | "no-network"
  | "no-internet"
  | "backend-unavailable"
  | "ready";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const INTERNET_PROBE_URL = "https://www.gstatic.com/generate_204";
const CONNECTION_LOSS_DELAY = 5000;
const MONITOR_INTERVAL = 5000;

async function checkInternet(timeout = 10000): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    await fetch(INTERNET_PROBE_URL, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });

    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

async function checkBackend(timeout = 45000): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_URL}/`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

export default function StartupGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<StartupStatus>("checking");
  const [retrying, setRetrying] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);

  const checkId = useRef(0);
  const readyRef = useRef(false);
  const connectionTimer = useRef<number | undefined>(undefined);
  const monitorCheckId = useRef(0);
  const monitorInProgress = useRef(false);

  const checkConnection = useCallback(async () => {
    const currentCheck = ++checkId.current;

    readyRef.current = false;
    setRetrying(true);
    setStatus("checking");
    setConnectionLost(false);

    try {
      let networkConnected: boolean;

      try {
        const network = await Network.getStatus();
        networkConnected = network.connected;
      } catch {
        networkConnected = navigator.onLine;
      }

      if (currentCheck !== checkId.current) return;

      if (!networkConnected) {
        setStatus("no-network");
        return;
      }

      const internetAvailable = await checkInternet();

      if (currentCheck !== checkId.current) return;

      if (!internetAvailable) {
        setStatus("no-internet");
        return;
      }

      const backendAvailable = await checkBackend();

      if (currentCheck !== checkId.current) return;

      if (!backendAvailable) {
        setStatus("backend-unavailable");
        return;
      }

      readyRef.current = true;
      setStatus("ready");
    } catch {
      if (currentCheck === checkId.current) {
        setStatus("no-internet");
      }
    } finally {
      if (currentCheck === checkId.current) {
        setRetrying(false);
      }
    }
  }, []);

  useEffect(() => {
    void checkConnection();

    let disposed = false;
    let listener: { remove: () => Promise<void> } | undefined;
    let monitorInterval: number | undefined;

    const clearConnectionTimer = () => {
      if (connectionTimer.current !== undefined) {
        window.clearTimeout(connectionTimer.current);
        connectionTimer.current = undefined;
      }
    };

    const verifyRecovery = async () => {
      if (monitorInProgress.current || disposed) return;

      monitorInProgress.current = true;
      const currentCheck = ++monitorCheckId.current;

      try {
        const internetAvailable = await checkInternet(5000);

        if (currentCheck !== monitorCheckId.current || disposed) return;

        if (internetAvailable) {
          clearConnectionTimer();
          setConnectionLost(false);
        } else {
          scheduleConnectionCheck();
        }
      } finally {
        monitorInProgress.current = false;
      }
    };

    const confirmConnectionLoss = async () => {
      connectionTimer.current = undefined;

      if (disposed || !readyRef.current) return;

      if (monitorInProgress.current) {
        connectionTimer.current = window.setTimeout(
          () => void confirmConnectionLoss(),
          1000
        );
        return;
      }

      monitorInProgress.current = true;
      const currentCheck = ++monitorCheckId.current;

      try {
        let networkConnected: boolean;

        try {
          const network = await Network.getStatus();
          networkConnected = network.connected;
        } catch {
          networkConnected = navigator.onLine;
        }

        if (currentCheck !== monitorCheckId.current || disposed) return;

        if (!networkConnected) {
          setConnectionLost(true);
          return;
        }

        const internetAvailable = await checkInternet(5000);

        if (currentCheck !== monitorCheckId.current || disposed) return;

        setConnectionLost(!internetAvailable);

        if (!internetAvailable) {
          scheduleConnectionCheck();
        }
      } finally {
        monitorInProgress.current = false;
      }
    };

    const scheduleConnectionCheck = () => {
      if (!readyRef.current || disposed) return;

      if (connectionTimer.current !== undefined) return;

      connectionTimer.current = window.setTimeout(
        () => void confirmConnectionLoss(),
        CONNECTION_LOSS_DELAY
      );
    };

    const runPeriodicMonitor = async () => {
      if (!readyRef.current || disposed || monitorInProgress.current) return;

      monitorInProgress.current = true;
      const currentCheck = ++monitorCheckId.current;

      try {
        const internetAvailable = await checkInternet(5000);

        if (currentCheck !== monitorCheckId.current || disposed) return;

        if (internetAvailable) {
          clearConnectionTimer();
          setConnectionLost(false);
        } else {
          scheduleConnectionCheck();
        }
      } finally {
        monitorInProgress.current = false;
      }
    };

    const handleOnline = () => {
      if (!readyRef.current) {
        void checkConnection();
        return;
      }

      void verifyRecovery();
    };

    const handleOffline = () => {
      if (!readyRef.current) {
        void checkConnection();
        return;
      }

      scheduleConnectionCheck();
    };

    const handleNetworkChange = (connected: boolean) => {
      if (!readyRef.current) {
        void checkConnection();
        return;
      }

      if (connected) {
        void verifyRecovery();
      } else {
        scheduleConnectionCheck();
      }
    };

    monitorInterval = window.setInterval(
      () => void runPeriodicMonitor(),
      MONITOR_INTERVAL
    );

    Network.addListener("networkStatusChange", (network) => {
      handleNetworkChange(network.connected);
    })
      .then((handle) => {
        if (disposed) {
          void handle.remove();
        } else {
          listener = handle;
        }
      })
      .catch((error) => {
        console.warn("Não foi possível registar o monitor de rede:", error);
      });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      disposed = true;
      readyRef.current = false;

      clearConnectionTimer();

      if (monitorInterval !== undefined) {
        window.clearInterval(monitorInterval);
      }

      ++monitorCheckId.current;
      ++checkId.current;

      void listener?.remove();

      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkConnection]);

  if (status !== "ready") {
    const messages = {
      checking: {
        title: "A verificar ligação...",
        description:
          "Estamos a verificar a tua ligação à Internet e aos servidores do NAI-SHOPPING.",
      },
      "no-network": {
        title: "Sem ligação à rede",
        description:
          "Não conseguimos detetar uma ligação Wi-Fi ou de dados móveis. Verifica a tua ligação e tenta novamente.",
      },
      "no-internet": {
        title: "Sem acesso à Internet",
        description:
          "O teu dispositivo está ligado à rede, mas não conseguimos aceder à Internet. Verifica a tua ligação.",
      },
      "backend-unavailable": {
        title: "Servidor temporariamente indisponível",
        description:
          "A tua Internet está a funcionar, mas os servidores do NAI-SHOPPING não estão a responder. Aguarda um pouco e tenta novamente.",
      },
      ready: {
        title: "",
        description: "",
      },
    };

    const message = messages[status];

    return (
      <main className="startup-gate">
        <div className="startup-gate-card">
          <img
            className="startup-gate-logo"
            src="/nai-shopping-inicializacao.png"
            alt="NAI-SHOPPING"
          />

          <h1>{message.title}</h1>
          <p>{message.description}</p>

          {status === "checking" ? (
            <div className="startup-gate-loader" />
          ) : (
            <button
              type="button"
              onClick={() => void checkConnection()}
              disabled={retrying}
            >
              {retrying ? "A verificar..." : "Tentar novamente"}
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <>
      {children}

      {connectionLost && (
        <div
          className="connection-lost-indicator"
          role="status"
          aria-live="polite"
        >
          <span className="connection-lost-indicator-dot" />
          <span>Sem ligação à Internet. A aguardar ligação...</span>
        </div>
      )}
    </>
  );
}
