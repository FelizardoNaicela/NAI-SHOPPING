import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { io, Socket } from "socket.io-client";

import { api } from "../services/api";

import styles from "./NationalRankingAuctionPage.module.css";
import FloatingDrawers from "../components/drawer/FloatingDrawers";


/* =========================================================
   TIPOS
========================================================= */

type NationalRankingAuction = {
  id: string;

  countryCode: string;

  position: number;

  name: string;

  imageUrl?: string | null;

  startPrice: number;

  currentBid?: number | null;

  minimumIncrement?: number | null;

  reservePrice?: number | null;

  startsAt: string;

  endsAt: string;

  closed: boolean;

  closedAt?: string | null;

  finalPrice?: number | null;

  winnerStoreId?: string | null;
};


type AuctionBid = {
  id: string;

  amount: number;

  isWinning?: boolean;

  createdAt: string;

  userId?: string | null;

  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;

  storeId?: string | null;

  store?: {
    id?: string;
    name?: string | null;
    avatarUrl?: string | null;
  } | null;
};


type AuctionStatus = {
  closed?: boolean;

  currentBid?: number | null;

  winnerStoreId?: string | null;

  endsAt?: string | null;

  viewerCount?: number;
};


type NewBidEvent = {
  auctionId: string;

  bidId?: string;

  currentBid?: number | null;

  winnerUserId?: string | null;

  winnerName?: string | null;

  storeId?: string | null;

  storeName?: string | null;

  storeAvatarUrl?: string | null;

  createdAt?: string;

  isWinning?: boolean;
};


type AuctionExtendedEvent = {
  auctionId: string;

  newEndDate: string;
};


type AuctionClosedEvent = {
  auctionId: string;

  winnerStoreId?: string | null;

  finalBid?: number | null;
};


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function getPositionLabel(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";

  return `${position}º`;
}


function formatPrice(value?: number | null) {
  if (
    value == null ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `${Number(value).toLocaleString("pt-MZ")} MT`;
}


function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}


function formatTimeRemaining(
  milliseconds: number,
) {
  if (milliseconds <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(
    milliseconds / 1000,
  );

  const days = Math.floor(
    totalSeconds / 86400,
  );

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600,
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  );

  const seconds =
    totalSeconds % 60;


  const hh = String(hours).padStart(
    2,
    "0",
  );

  const mm = String(minutes).padStart(
    2,
    "0",
  );

  const ss = String(seconds).padStart(
    2,
    "0",
  );


  if (days > 0) {
    return `${days}d ${hh}:${mm}:${ss}`;
  }

  return `${hh}:${mm}:${ss}`;
}


/**
 * Converte uma URL de imagem do backend
 * para uma URL que o navegador consiga abrir.
 *
 * Aceita:
 *
 * http://localhost:3000/uploads/...
 *
 * https://...
 *
 * /uploads/...
 *
 * uploads/...
 */
function getImageUrl(
  imageUrl?: string | null,
) {
  if (!imageUrl) {
    return "";
  }

  const normalized =
    imageUrl.trim();

  if (!normalized) {
    return "";
  }

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("data:")
  ) {
    return normalized;
  }

  const apiBaseUrl =
    String(
      api.defaults.baseURL ?? "",
    ).replace(/\/$/, "");

  if (
    normalized.startsWith("/")
  ) {
    return `${apiBaseUrl}${normalized}`;
  }

  return `${apiBaseUrl}/${normalized}`;
}


/**
 * Verifica apenas se existe uma sessão
 * local no navegador.
 *
 * A autorização real para dar lance
 * continua sendo responsabilidade do backend.
 */
function isUserLoggedIn() {
  const token =
    localStorage.getItem("token");

  return Boolean(
    token &&
    token.trim(),
  );
}


/**
 * Tenta transformar diferentes respostas
 * de erro do NestJS em uma mensagem
 * amigável para o usuário.
 */
function getBidErrorMessage(
  error: any,
) {
  const responseData =
    error?.response?.data;

  const status =
    error?.response?.status;

  let message =
    responseData?.message;


  if (Array.isArray(message)) {
    message =
      message.join(", ");
  }


  if (
    typeof message === "string"
  ) {

    const normalized =
      message.toLowerCase();


    /*
     * Casos comuns de autenticação.
     */
    if (
      status === 401 ||
      normalized.includes(
        "não autenticado",
      ) ||
      normalized.includes(
        "nao autenticado",
      ) ||
      normalized.includes(
        "unauthorized",
      ) ||
      normalized.includes(
        "jwt",
      ) ||
      normalized.includes(
        "token",
      )
    ) {
      return "Você precisa estar autenticado para participar deste leilão.";
    }


    /*
     * Casos relacionados com banca
     * não verificada / não elegível.
     */
    if (
      normalized.includes(
        "verificada",
      ) ||
      normalized.includes(
        "verificado",
      ) ||
      normalized.includes(
        "premium",
      ) ||
      normalized.includes(
        "banca",
      ) ||
      normalized.includes(
        "loja",
      ) ||
      normalized.includes(
        "store",
      ) ||
      normalized.includes(
        "elegível",
      ) ||
      normalized.includes(
        "elegivel",
      )
    ) {
      return message;
    }


    return message;
  }


  if (status === 401) {
    return "Você precisa estar autenticado para participar deste leilão.";
  }


  if (status === 403) {
    return "Sua conta ou banca não tem permissão para participar deste leilão.";
  }


  if (status === 400) {
    return "O lance não pôde ser realizado. Verifique o valor e tente novamente.";
  }


  return "Não foi possível realizar o lance. Tente novamente.";
}


function getAuctionStatus(
  auction: NationalRankingAuction,
  now: number,
) {
  if (auction.closed) {
    return "ENCERRADO";
  }

  const startsAt =
    new Date(
      auction.startsAt,
    ).getTime();

  const endsAt =
    new Date(
      auction.endsAt,
    ).getTime();


  if (now < startsAt) {
    return "EM BREVE";
  }


  if (now >= endsAt) {
    return "A ENCERRAR";
  }


  return "ATIVO";
}


/* =========================================================
   COMPONENTE
========================================================= */

export default function NationalRankingAuctionPage() {

  const {
    auctionId,
  } = useParams<{
    auctionId: string;
  }>();


  const navigate =
    useNavigate();


  const [
    auction,
    setAuction,
  ] = useState<
    NationalRankingAuction | null
  >(null);


  const [
    bids,
    setBids,
  ] = useState<AuctionBid[]>([]);


  const [
    viewerCount,
    setViewerCount,
  ] = useState(0);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    bidAmount,
    setBidAmount,
  ] = useState("");


  const [
    bidding,
    setBidding,
  ] = useState(false);


  const [
    bidError,
    setBidError,
  ] = useState("");


  const [
    bidSuccess,
    setBidSuccess,
  ] = useState("");


  const [
    now,
    setNow,
  ] = useState(
    Date.now(),
  );


  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(false);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    imageError,
    setImageError,
  ] = useState(false);


  /* =======================================================
     CARREGAR LEILÃO
  ======================================================= */

  const loadAuction =
    useCallback(
      async () => {

        if (!auctionId) {

          setError(
            "Leilão não encontrado.",
          );

          setLoading(false);

          return;
        }


        try {

          setError("");


          const response =
            await api.get(
              `/ranking/national/auctions/auction/${auctionId}`,
            );


          const data =
            response.data;


          setAuction(data);

          setImageError(false);


        } catch (err) {



          setError(
            "Não foi possível carregar este leilão.",
          );


        } finally {

          setLoading(false);

        }

      },
      [auctionId],
    );


  /* =======================================================
     CARREGAR HISTÓRICO
  ======================================================= */

  const loadHistory =
    useCallback(
      async () => {

        if (!auctionId) {
          return;
        }


        try {

          const response =
            await api.get(
              `/ranking/national/auctions/auction/${auctionId}/history`,
            );


          const data =
            Array.isArray(response.data)
              ? response.data
              : [];


          setBids(data);


        } catch (err) {


        }

      },
      [auctionId],
    );


  /* =======================================================
     CARREGAR STATUS
  ======================================================= */

  const loadStatus =
    useCallback(
      async () => {

        if (!auctionId) {
          return;
        }


        try {

          const response =
            await api.get(
              `/ranking/national/auctions/auction/${auctionId}/status`,
            );


          const status:
            AuctionStatus =
            response.data;


          setAuction(
            previous => {

              if (!previous) {
                return previous;
              }


              return {
                ...previous,

                closed:
                  status.closed ??
                  previous.closed,

                currentBid:
                  status.currentBid ??
                  previous.currentBid,

                winnerStoreId:
                  status.winnerStoreId ??
                  previous.winnerStoreId,

                endsAt:
                  status.endsAt ??
                  previous.endsAt,
              };

            },
          );


          if (
            typeof status.viewerCount ===
            "number"
          ) {

            setViewerCount(
              status.viewerCount,
            );

          }


        } catch (err) {



        }

      },
      [auctionId],
    );


  /* =======================================================
     CARREGAMENTO INICIAL
  ======================================================= */

  useEffect(() => {

    loadAuction();

    loadHistory();

    loadStatus();

  }, [
    loadAuction,
    loadHistory,
    loadStatus,
  ]);


  /* =======================================================
     RELÓGIO
  ======================================================= */

  useEffect(() => {

    const interval =
      window.setInterval(
        () => {

          setNow(
            Date.now(),
          );

        },
        1000,
      );


    return () => {

      window.clearInterval(
        interval,
      );

    };

  }, []);


  /* =======================================================
     SOCKET.IO
  ======================================================= */

  useEffect(() => {

    if (!auctionId) {
      return;
    }


    const socket: Socket =
      io(
        import.meta.env.VITE_SOCKET_URL ||
        "http://localhost:3000",
        {
          transports: [
            "websocket",
          ],
        },
      );


    socket.emit(
      "national-ranking-auction:join",
      {
        auctionId,
      },
    );


    socket.on(
      "national-ranking-auction:viewers",
      (data: {
        auctionId: string;
        count?: number;
        viewerCount?: number;
      }) => {

        if (
          data.auctionId !==
          auctionId
        ) {
          return;
        }


        setViewerCount(
          data.count ??
          data.viewerCount ??
          0,
        );

      },
    );


    socket.on(
      "national-ranking-auction:newBid",
      (
        data: NewBidEvent,
      ) => {

        if (
          data.auctionId !==
          auctionId
        ) {
          return;
        }


        setAuction(
          previous => {

            if (!previous) {
              return previous;
            }


            return {
              ...previous,

              currentBid:
                data.currentBid ??
                previous.currentBid,

            };

          },
        );


        if (data.bidId) {

          setBids(
            previous => {

              const alreadyExists =
                previous.some(
                  bid =>
                    bid.id ===
                    data.bidId,
                );


              if (
                alreadyExists
              ) {
                return previous;
              }


              const newBid:
                AuctionBid = {

                id:
                  data.bidId!,

                amount:
                  data.currentBid ??
                  0,

                isWinning:
                  data.isWinning ??
                  true,

                createdAt:
                  data.createdAt ??
                  new Date().toISOString(),

                userId:
                  data.winnerUserId ??
                  null,

                user:
                  data.winnerName
                    ? {
                        id:
                          data.winnerUserId ??
                          undefined,

                        name:
                          data.winnerName,
                      }
                    : null,

                storeId:
                  data.storeId ??
                  null,

                store:
                  data.storeName
                    ? {
                        id:
                          data.storeId ??
                          undefined,

                        name:
                          data.storeName,

                        avatarUrl:
                          data.storeAvatarUrl ??
                          null,
                      }
                    : null,
              };


              return [
                newBid,
                ...previous,
              ];

            },
          );

        } else {

          loadHistory();

        }

      },
    );


    socket.on(
      "national-ranking-auction:extended",
      (
        data: AuctionExtendedEvent,
      ) => {

        if (
          data.auctionId !==
          auctionId
        ) {
          return;
        }


        setAuction(
          previous => {

            if (!previous) {
              return previous;
            }


            return {
              ...previous,

              endsAt:
                data.newEndDate,

            };

          },
        );

      },
    );


    socket.on(
      "national-ranking-auction:closed",
      (
        data: AuctionClosedEvent,
      ) => {

        if (
          data.auctionId !==
          auctionId
        ) {
          return;
        }


        setAuction(
          previous => {

            if (!previous) {
              return previous;
            }


            return {
              ...previous,

              closed: true,

              closedAt:
                previous.closedAt ??
                new Date().toISOString(),

              finalPrice:
                data.finalBid ??
                previous.finalPrice ??
                previous.currentBid,

              winnerStoreId:
                data.winnerStoreId ??
                previous.winnerStoreId,
            };

          },
        );


        loadHistory();

      },
    );


    return () => {

      socket.emit(
        "national-ranking-auction:leave",
        {
          auctionId,
        },
      );


      socket.disconnect();

    };

  }, [
    auctionId,
    loadHistory,
  ]);


  /* =======================================================
     ATUALIZAR MANUALMENTE
  ======================================================= */

  async function handleRefresh() {

    try {

      setRefreshing(true);

      setBidError("");
      setBidSuccess("");


      await Promise.all([
        loadAuction(),
        loadHistory(),
        loadStatus(),
      ]);

    } finally {

      setRefreshing(false);

    }

  }


  /* =======================================================
     LANCE ATUAL
  ======================================================= */

  const currentBid =
    useMemo(() => {

      if (!auction) {
        return 0;
      }


      return (
        auction.currentBid ??
        auction.startPrice
      );

    }, [auction]);


  /* =======================================================
     PRÓXIMO LANCE
  ======================================================= */

  const minimumNextBid =
    useMemo(() => {

      if (!auction) {
        return 0;
      }


      const increment =
        auction.minimumIncrement ??
        0;


      return (
        currentBid +
        increment
      );

    }, [
      auction,
      currentBid,
    ]);


  /* =======================================================
     STATUS
  ======================================================= */

  const status =
    auction
      ? getAuctionStatus(
          auction,
          now,
        )
      : "";


  const startsAt =
    auction
      ? new Date(
          auction.startsAt,
        ).getTime()
      : 0;


  const endsAt =
    auction
      ? new Date(
          auction.endsAt,
        ).getTime()
      : 0;


  const isUpcoming =
    status ===
    "EM BREVE";


  const isActive =
    status ===
    "ATIVO";


  const isClosed =
    status ===
    "ENCERRADO";


  const countdownTarget =
    isUpcoming
      ? startsAt
      : endsAt;


  const countdown =
    formatTimeRemaining(
      countdownTarget -
        now,
    );


  /* =======================================================
     AUTENTICAÇÃO
  ======================================================= */

  const loggedIn =
    isUserLoggedIn();


  /*
   * Importante:
   *
   * loggedIn NÃO significa que a banca
   * já pode participar.
   *
   * A confirmação de:
   *
   * - banca existente
   * - banca verificada
   * - PREMIUM
   * - país correto
   * - outras regras
   *
   * continua no backend.
   */
  const canAttemptBid =
    loggedIn &&
    isActive &&
    !isClosed;


  /* =======================================================
     VALIDAÇÃO DO LANCE
  ======================================================= */

  const numericBid =
    Number(
      bidAmount.replace(
        ",",
        ".",
      ),
    );


  const bidIsValid =
    Number.isFinite(
      numericBid,
    ) &&
    numericBid >=
      minimumNextBid;


  /* =======================================================
     FAZER LANCE
  ======================================================= */

  async function handleBid() {

    setBidError("");
    setBidSuccess("");


    if (!auctionId) {

      setBidError(
        "Leilão não encontrado.",
      );

      return;

    }


    /*
     * Primeiro verificamos login.
     */
    if (!loggedIn) {

      setBidError(
        "Você precisa entrar na sua conta para participar deste leilão.",
      );

      return;

    }


    /*
     * Depois verificamos se o leilão está ativo.
     */
    if (!isActive) {

      setBidError(
        isUpcoming
          ? "Este leilão ainda não começou."
          : "Este leilão não está ativo.",
      );

      return;

    }


    /*
     * Validação do valor.
     */
    if (!bidIsValid) {

      setBidError(
        `O lance mínimo é ${formatPrice(
          minimumNextBid,
        )}.`,
      );

      return;

    }


    try {

      setBidding(true);


      const response =
        await api.post(
          `/ranking/national/auctions/auction/${auctionId}/bid`,
          {
            amount:
              numericBid,
          },
        );


      const result =
        response.data;


      /*
       * Se o backend devolver o leilão
       * atualizado, usamos os dados dele.
       */
      if (
        result?.auction
      ) {

        setAuction(
          result.auction,
        );

      } else {

        /*
         * Caso contrário, atualizamos
         * pelo menos o lance atual localmente.
         */
        setAuction(
          previous => {

            if (!previous) {
              return previous;
            }


            return {
              ...previous,

              currentBid:
                numericBid,

            };

          },
        );

      }


      setBidAmount("");


      setBidSuccess(
        "Lance realizado com sucesso!",
      );


      await loadHistory();


    } catch (err: any) {


      const message =
        getBidErrorMessage(
          err,
        );


      setBidError(
        message,
      );


    } finally {

      setBidding(false);

    }

  }


  /* =======================================================
     LOGIN
  ======================================================= */

  function handleLogin() {

    /*
     * Mantemos uma rota simples para
     * o login do projeto.
     *
     * Se o seu App.tsx usa outra rota
     * de login, basta trocar aqui.
     */
    navigate(
      "/login",
    );

  }


  /* =======================================================
     RENDER — LOADING
  ======================================================= */

  if (loading) {

    return (
      <div
        className={
          styles.page
        }
      >

        <div
          className={
            styles.loading
          }
        >

          <div
            className={
              styles.loadingSpinner
            }
          />

          <p>
            Carregando leilão...
          </p>

        </div>

      </div>
    );

  }


  /* =======================================================
     RENDER — ERRO
  ======================================================= */

  if (
    error ||
    !auction
  ) {

    return (
      <div
        className={
          styles.page
        }
      >

        <div
          className={
            styles.errorPage
          }
        >

          <div
            className={
              styles.errorIcon
            }
          >
            ⚠️
          </div>


          <h1>
            Leilão indisponível
          </h1>


          <p>
            {error ||
              "Este leilão não foi encontrado."}
          </p>


          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={() =>
              navigate(
                `/ranking/national/auctions?countryCode=${
                  auction?.countryCode ??
                  "MZ"
                }`,
              )
            }
          >
            ← Voltar aos leilões
          </button>

        </div>

      </div>
    );

  }


  /*
   * URL da imagem.
   */
  const auctionImageUrl =
    getImageUrl(
      auction.imageUrl,
    );


  /* =======================================================
     RENDER PRINCIPAL
  ======================================================= */

  return (

    <div
      className={
        styles.page
      }
    >
                <FloatingDrawers/>

      {/* ===================================================
          TOPO
      =================================================== */}

      <header
        className={
          styles.header
        }
      >

        <button
          type="button"
          className={
            styles.backButton
          }
          onClick={() =>
            navigate(
              `/ranking/national/auctions?countryCode=${auction.countryCode}`,
            )
          }
        >
          ←

          <span>
            Voltar aos leilões
          </span>

        </button>


        <button
          type="button"
          className={
            styles.refreshButton
          }
          onClick={
            handleRefresh
          }
          disabled={
            refreshing
          }
        >

          {refreshing
            ? "Atualizando..."
            : "↻ Atualizar"}

        </button>

      </header>


      {/* ===================================================
          POSIÇÃO / STATUS
      =================================================== */}

      <section
        className={
          styles.positionHero
        }
      >

        <div
          className={
            styles.positionHeroLeft
          }
        >

          <div
            className={
              styles.positionMedal
            }
          >
            {getPositionLabel(
              auction.position,
            )}
          </div>


          <div>

            <div
              className={
                styles.eyebrow
              }
            >
              RANKING NACIONAL
            </div>


            <h1
              className={
                styles.title
              }
            >
              Posição #{auction.position}
            </h1>


            <p
              className={
                styles.countryText
              }
            >
              País:{" "}

              <strong>
                {auction.countryCode}
              </strong>
            </p>

          </div>

        </div>


        <div
          className={
            styles.heroStatus
          }
        >

          <span
            className={`
              ${styles.status}
              ${
                isClosed
                  ? styles.statusClosed
                  : isUpcoming
                  ? styles.statusUpcoming
                  : status ===
                    "A ENCERRAR"
                  ? styles.statusEnding
                  : styles.statusActive
              }
            `}
          >
            {status}
          </span>


          <div
            className={
              styles.viewerCount
            }
          >
            👁️{" "}
            {viewerCount}{" "}
            {viewerCount === 1
              ? "pessoa"
              : "pessoas"}
          </div>

        </div>

      </section>


      {/* ===================================================
          LAYOUT PRINCIPAL
      =================================================== */}

      <main
        className={
          styles.mainGrid
        }
      >

        {/* =================================================
            ESQUERDA
        ================================================= */}

        <section
          className={
            styles.mainColumn
          }
        >

          {/* ===============================================
              IMAGEM
          =============================================== */}

          <div
            className={
              styles.imageCard
            }
          >

            {auctionImageUrl &&
            !imageError ? (

              <img
                src={
                  auctionImageUrl
                }
                alt={
                  `Leilão da posição ${auction.position}`
                }
                className={
                  styles.auctionImage
                }
                onError={() =>
                  setImageError(
                    true,
                  )
                }
              />

            ) : (

              <div
                className={
                  styles.imagePlaceholder
                }
              >

                <span>
                  {getPositionLabel(
                    auction.position,
                  )}
                </span>

                <strong>
                  Ranking Nacional
                </strong>

                <small>
                  Posição{" "}
                  #{auction.position}
                </small>

              </div>

            )}

          </div>


          {/* ===============================================
              INFORMAÇÕES
          =============================================== */}

          <section
            className={
              styles.infoCard
            }
          >

            <div
              className={
                styles.cardEyebrow
              }
            >
              🔨 LEILÃO
            </div>


            <h2
              className={
                styles.auctionName
              }
            >
              {auction.name}
            </h2>


            <p
              className={
                styles.description
              }
            >
              Este leilão corresponde à
              posição{" "}
              <strong>
                #{auction.position}
              </strong>{" "}
              do Ranking Nacional.
            </p>


            <div
              className={
                styles.infoGrid
              }
            >

              <div
                className={
                  styles.infoItem
                }
              >

                <span>
                  País
                </span>

                <strong>
                  {auction.countryCode}
                </strong>

              </div>


              <div
                className={
                  styles.infoItem
                }
              >

                <span>
                  Posição
                </span>

                <strong>
                  #{auction.position}
                </strong>

              </div>


              <div
                className={
                  styles.infoItem
                }
              >

                <span>
                  Início
                </span>

                <strong>
                  {formatDate(
                    auction.startsAt,
                  )}
                </strong>

              </div>


              <div
                className={
                  styles.infoItem
                }
              >

                <span>
                  Término
                </span>

                <strong>
                  {formatDate(
                    auction.endsAt,
                  )}
                </strong>

              </div>

            </div>

          </section>


          {/* ===============================================
              HISTÓRICO DESKTOP
          =============================================== */}

          <section
            className={
              styles.historyCard
            }
          >

            <div
              className={
                styles.sectionHeader
              }
            >

              <div>

                <span
                  className={
                    styles.cardEyebrow
                  }
                >
                  HISTÓRICO
                </span>

                <h2>
                  Lances
                </h2>

              </div>


              <span
                className={
                  styles.bidCount
                }
              >
                {bids.length}
              </span>

            </div>


            {bids.length === 0 ? (

              <div
                className={
                  styles.emptyHistory
                }
              >
                Ainda não existem
                lances registrados.
              </div>

            ) : (

              <div
                className={
                  styles.bidList
                }
              >

                {bids.map(
                  (
                    bid,
                    index,
                  ) => {

                    const bidderName =
                      bid.store?.name ||
                      bid.user?.name ||
                      "Participante";


                    return (

                      <div
                        key={
                          bid.id
                        }
                        className={`
                          ${styles.bidRow}
                          ${
                            index === 0 ||
                            bid.isWinning
                              ? styles.winningBid
                              : ""
                          }
                        `}
                      >

                        <div
                          className={
                            styles.bidIdentity
                          }
                        >

                          {bid.store
                            ?.avatarUrl ? (

                            <img
                              src={
                                getImageUrl(
                                  bid.store.avatarUrl,
                                )
                              }
                              alt=""
                              className={
                                styles.bidAvatar
                              }
                            />

                          ) : (

                            <div
                              className={
                                styles.bidAvatarPlaceholder
                              }
                            >
                              🏪
                            </div>

                          )}


                          <div>

                            <strong>
                              {bidderName}
                            </strong>

                            <span>
                              {formatDate(
                                bid.createdAt,
                              )}
                            </span>

                          </div>

                        </div>


                        <div
                          className={
                            styles.bidAmount
                          }
                        >

                          {index === 0 ||
                          bid.isWinning ? (

                            <span
                              className={
                                styles.winningLabel
                              }
                            >
                              MAIOR LANCE
                            </span>

                          ) : null}


                          <strong>
                            {formatPrice(
                              bid.amount,
                            )}
                          </strong>

                        </div>

                      </div>

                    );

                  },
                )}

              </div>

            )}

          </section>

        </section>


        {/* =================================================
            DIREITA
        ================================================= */}

        <aside
          className={
            styles.sideColumn
          }
        >

          {/* ===============================================
              VALOR
          =============================================== */}

          <section
            className={
              styles.bidCard
            }
          >

            <div
              className={
                styles.bidCardHeader
              }
            >

              <span>
                Lance atual
              </span>


              <strong>
                {formatPrice(
                  currentBid,
                )}
              </strong>

            </div>


            <div
              className={
                styles.nextBidBox
              }
            >

              <span>
                Próximo lance mínimo
              </span>


              <strong>
                {formatPrice(
                  minimumNextBid,
                )}
              </strong>

            </div>


            {/* =============================================
                CONTAGEM
            ============================================= */}

            {!isClosed && (

              <div
                className={
                  styles.countdownBox
                }
              >

                <span>
                  {isUpcoming
                    ? "Começa em"
                    : "Termina em"}
                </span>


                <strong>
                  {countdown}
                </strong>

              </div>

            )}


            {/* =============================================
                ENCERRADO
            ============================================= */}

            {isClosed && (

              <div
                className={
                  styles.closedBox
                }
              >

                <span>
                  🏆 Resultado final
                </span>


                <strong>
                  {formatPrice(
                    auction.finalPrice ??
                    auction.currentBid ??
                    auction.startPrice,
                  )}
                </strong>

              </div>

            )}


            {/* =============================================
                MENSAGEM ERRO
            ============================================= */}

            {bidError && (

              <div
                className={
                  styles.bidError
                }
              >
                ⚠️{" "}
                {bidError}
              </div>

            )}


            {/* =============================================
                SUCESSO
            ============================================= */}

            {bidSuccess && (

              <div
                className={
                  styles.bidSuccess
                }
              >
                ✓{" "}
                {bidSuccess}
              </div>

            )}


            {/* =============================================
                NÃO AUTENTICADO
            ============================================= */}

            {!loggedIn &&
            isActive && (

              <div
                style={{
                  marginTop:
                    "16px",
                  padding:
                    "16px",
                  borderRadius:
                    "12px",
                  background:
                    "rgba(255, 193, 7, 0.10)",
                  border:
                    "1px solid rgba(255, 193, 7, 0.25)",
                }}
              >

                <strong>
                  🔐 Entre na sua conta
                </strong>

                <p
                  style={{
                    margin:
                      "8px 0 12px",
                    fontSize:
                      "0.9rem",
                  }}
                >
                  Para participar deste
                  leilão e fazer lances,
                  primeiro precisa entrar
                  na sua conta.
                </p>


                <button
                  type="button"
                  className={
                    styles.bidButton
                  }
                  onClick={
                    handleLogin
                  }
                >
                  Entrar para participar
                </button>

              </div>

            )}


            {/* =============================================
                FORMULÁRIO
            ============================================= */}

            {canAttemptBid && (

              <div
                className={
                  styles.bidForm
                }
              >

                <label
                  htmlFor="national-ranking-bid"
                >
                  Seu lance
                </label>


                <div
                  className={
                    styles.bidInputWrapper
                  }
                >

                  <input
                    id="national-ranking-bid"
                    type="number"
                    min={
                      minimumNextBid
                    }
                    step="0.01"
                    value={
                      bidAmount
                    }
                    onChange={(
                      event,
                    ) => {

                      setBidAmount(
                        event.target.value,
                      );

                      setBidError("");

                      setBidSuccess("");

                    }}
                    placeholder={
                      String(
                        minimumNextBid,
                      )
                    }
                    disabled={
                      bidding
                    }
                  />


                  <span>
                    MT
                  </span>

                </div>


                <button
                  type="button"
                  className={
                    styles.bidButton
                  }
                  onClick={
                    handleBid
                  }
                  disabled={
                    bidding ||
                    !bidIsValid
                  }
                >

                  {bidding
                    ? "Enviando lance..."
                    : "🔨 Fazer lance"}

                </button>


                <p
                  className={
                    styles.bidHint
                  }
                >
                  O lance deve ser igual
                  ou superior ao mínimo
                  indicado.
                </p>

              </div>

            )}


            {/* =============================================
                LEILÃO AINDA NÃO COMEÇOU
            ============================================= */}

            {isUpcoming && (

              <div
                className={
                  styles.upcomingMessage
                }
              >
                Este leilão ainda não
                começou. Você poderá
                participar quando o
                horário de início chegar.
              </div>

            )}


            {/* =============================================
                ENCERRADO
            ============================================= */}

            {isClosed && (

              <div
                className={
                  styles.closedMessage
                }
              >
                Este leilão já foi
                encerrado. Consulte o
                histórico para ver os
                lances registrados.
              </div>

            )}

          </section>


          {/* ===============================================
              DATAS
          =============================================== */}

          <section
            className={
              styles.datesCard
            }
          >

            <h3>
              📅 Datas do leilão
            </h3>


            <div
              className={
                styles.dateRow
              }
            >

              <span>
                Início
              </span>

              <strong>
                {formatDate(
                  auction.startsAt,
                )}
              </strong>

            </div>


            <div
              className={
                styles.dateRow
              }
            >

              <span>
                Término
              </span>

              <strong>
                {formatDate(
                  auction.endsAt,
                )}
              </strong>

            </div>


            {auction.closedAt && (

              <div
                className={
                  styles.dateRow
                }
              >

                <span>
                  Encerrado em
                </span>

                <strong>
                  {formatDate(
                    auction.closedAt,
                  )}
                </strong>

              </div>

            )}

          </section>


          {/* ===============================================
              AVISO IMPORTANTE
          =============================================== */}

          <section
            className={
              styles.warningCard
            }
          >

            <div
              className={
                styles.warningIcon
              }
            >
              ℹ️
            </div>


            <div>

              <h3>
                Sobre este leilão
              </h3>


              <p>
                O leilão registra os
                lances e o seu resultado.
                O vencedor do leilão não
                recebe automaticamente a
                posição no Ranking Nacional.
              </p>


              <p>
                A atribuição da posição é
                realizada separadamente pela
                gestão do Ranking Nacional.
              </p>

            </div>

          </section>


          {/* ===============================================
              HISTÓRICO MOBILE
          =============================================== */}

          <button
            type="button"
            className={
              styles.mobileHistoryButton
            }
            onClick={() =>
              setHistoryOpen(
                true,
              )
            }
          >
            📋 Ver histórico dos lances
          </button>

        </aside>

      </main>


      {/* ===================================================
          HISTÓRICO MOBILE
      =================================================== */}

      {historyOpen && (

        <div
          className={
            styles.historyOverlay
          }
          onClick={() =>
            setHistoryOpen(
              false,
            )
          }
        >

          <div
            className={
              styles.historySheet
            }
            onClick={event =>
              event.stopPropagation()
            }
          >

            <div
              className={
                styles.sheetHeader
              }
            >

              <div>

                <span
                  className={
                    styles.cardEyebrow
                  }
                >
                  HISTÓRICO
                </span>

                <h2>
                  Lances
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setHistoryOpen(
                    false,
                  )
                }
                className={
                  styles.closeSheetButton
                }
              >
                ×
              </button>

            </div>


            {bids.length === 0 ? (

              <div
                className={
                  styles.emptyHistory
                }
              >
                Ainda não existem
                lances registrados.
              </div>

            ) : (

              <div
                className={
                  styles.bidList
                }
              >

                {bids.map(
                  (
                    bid,
                    index,
                  ) => {

                    const bidderName =
                      bid.store?.name ||
                      bid.user?.name ||
                      "Participante";


                    return (

                      <div
                        key={
                          bid.id
                        }
                        className={`
                          ${styles.bidRow}
                          ${
                            index === 0 ||
                            bid.isWinning
                              ? styles.winningBid
                              : ""
                          }
                        `}
                      >

                        <div
                          className={
                            styles.bidIdentity
                          }
                        >

                          {bid.store
                            ?.avatarUrl ? (

                            <img
                              src={
                                getImageUrl(
                                  bid.store.avatarUrl,
                                )
                              }
                              alt=""
                              className={
                                styles.bidAvatar
                              }
                            />

                          ) : (

                            <div
                              className={
                                styles.bidAvatarPlaceholder
                              }
                            >
                              🏪
                            </div>

                          )}


                          <div>

                            <strong>
                              {bidderName}
                            </strong>

                            <span>
                              {formatDate(
                                bid.createdAt,
                              )}
                            </span>

                          </div>

                        </div>


                        <div
                          className={
                            styles.bidAmount
                          }
                        >

                          {index === 0 ||
                          bid.isWinning ? (

                            <span
                              className={
                                styles.winningLabel
                              }
                            >
                              MAIOR LANCE
                            </span>

                          ) : null}


                          <strong>
                            {formatPrice(
                              bid.amount,
                            )}
                          </strong>

                        </div>

                      </div>

                    );

                  },
                )}

              </div>

            )}

          </div>

        </div>

      )}

    </div>

  );
}