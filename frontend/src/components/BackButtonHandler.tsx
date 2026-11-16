
import { useEffect, useRef } from "react";
import {
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import toast from "react-hot-toast";

export default function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();

  const historyStack = useRef<string[]>([location.key]);

  // Mantém um histórico das páginas visitadas dentro da aplicação.
  useEffect(() => {
    const stack = historyStack.current;

    if (navigationType === "PUSH") {
      stack.push(location.key);
    } else if (navigationType === "REPLACE") {
      stack[stack.length - 1] = location.key;
    } else if (navigationType === "POP") {
      const previousIndex = stack.lastIndexOf(location.key);

      if (previousIndex >= 0) {
        stack.splice(previousIndex + 1);
      } else {
        stack.splice(0, stack.length, location.key);
      }
    }
  }, [location.key, navigationType]);

  // Controla o botão físico de voltar do Android.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener:
      | { remove: () => Promise<void> }
      | null = null;

    let cancelled = false;

    const registerListener = async () => {
      listener = await CapacitorApp.addListener(
        "backButton",
        () => {
          if (historyStack.current.length > 1) {
            navigate(-1);
            return;
          }

          if (location.pathname !== "/") {
            historyStack.current = [location.key];
            navigate("/", { replace: true });
            return;
          }

          toast("Ja estas na pagina inicial.");
        }
      );

      if (cancelled) {
        await listener.remove();
      }
    };

    registerListener();

    return () => {
      cancelled = true;

      if (listener) {
        void listener.remove();
      }
    };
  }, [navigate, location.pathname, location.key]);

  return null;
}
