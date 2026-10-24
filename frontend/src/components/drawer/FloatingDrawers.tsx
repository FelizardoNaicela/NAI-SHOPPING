import {
  useEffect,
  useState,
} from "react";

import Drawer from "./Drawer";

import DrawerButton from "./DrawerButton";

import RightDrawerHandle from "./RightDrawerHandle";

import DrawerMenu from "./DrawerMenu";

import styles from "../layouts/MainLayout.module.css";

import { useAuth } from "../../auth/AuthProvider";

import PullToRefresh from "../PullToRefresh";

import useHeaderNotifications from "../../hooks/useHeaderNotifications";

import {
  getSocket,
} from "../../socket/socket";

import NationalRanking from "../ranking/NationalRanking";

export default function FloatingDrawers() {

  const [
    leftOpen,
    setLeftOpen,
  ] = useState(false);

  const [
    rightOpen,
    setRightOpen,
  ] = useState(false);

  const {
    user,
    isAuthenticated,
  } = useAuth();

  useHeaderNotifications(
    isAuthenticated
      ? {
          sub: user?.id,
        }
      : undefined,
  );

  // =========================================
  // PRESENÇA NO SITE
  // =========================================

  useEffect(() => {

    if (!isAuthenticated) {
      return;
    }

    let presenceInterval:
      ReturnType<typeof setInterval> | null =
        null;

    const sendActive = () => {

      const socket =
        getSocket();

      if (!socket) {
        return;
      }

      if (!socket.connected) {
        return;
      }

      socket.emit(
        "presence:active",
      );
    };

    const sendInactive = () => {

      const socket =
        getSocket();

      if (!socket) {
        return;
      }

      if (!socket.connected) {
        return;
      }

      socket.emit(
        "presence:inactive",
      );
    };

    // -----------------------------------------
    // SOCKET CONECTADO
    // -----------------------------------------

    const handleConnect = () => {

      sendActive();

      if (presenceInterval) {
        clearInterval(
          presenceInterval,
        );
      }

      presenceInterval =
        setInterval(
          sendActive,
          30_000,
        );
    };

    const socket =
      getSocket();

    if (!socket) {
      return;
    }

    if (socket.connected) {
      handleConnect();
    }

    socket.on(
      "connect",
      handleConnect,
    );

    // -----------------------------------------
    // VISIBILIDADE DA PÁGINA
    // -----------------------------------------

    const handleVisibility =
      () => {

        if (
          document.visibilityState ===
          "visible"
        ) {

          sendActive();

        } else {

          sendInactive();

        }

      };

    document.addEventListener(
      "visibilitychange",
      handleVisibility,
    );

    // -----------------------------------------
    // LIMPEZA
    // -----------------------------------------

    return () => {

      if (presenceInterval) {
        clearInterval(
          presenceInterval,
        );
      }

      socket.off(
        "connect",
        handleConnect,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );

      sendInactive();

    };

  }, [isAuthenticated]);

  return (
    <>

      <PullToRefresh />

      {/* =====================================
          BOTÃO ESQUERDO
      ===================================== */}

      <DrawerButton
        onClick={() =>
          setLeftOpen(
            v => !v,
          )
        }
      />

      {/* =====================================
          BOTÃO DIREITO
      ===================================== */}

      <RightDrawerHandle
        open={rightOpen}
        onToggle={() =>
          setRightOpen(
            v => !v,
          )
        }
      />

      {/* =====================================
          DRAWER ESQUERDO
      ===================================== */}

      <Drawer
        open={leftOpen}
        onClose={() =>
          setLeftOpen(false)
        }
        title="Menu"
      >

        <DrawerMenu
          onClose={() =>
            setLeftOpen(false)
          }
          user={user}
          isAuthenticated={
            isAuthenticated
          }
        />

      </Drawer>

      {/* =====================================
          DRAWER DIREITO
      ===================================== */}

      <Drawer
        side="right"
        open={rightOpen}
        onClose={() =>
          setRightOpen(false)
        }
        title="Ranking Nacional"
      >

        <div
          className={
            styles.cardContent
          }
        >

          <div
            className={
              styles.cardTitle
            }
          >
            Ranking Nacional
          </div>

          <NationalRanking />

        </div>

      </Drawer>

    </>
  );
}