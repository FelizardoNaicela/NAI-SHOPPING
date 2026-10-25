import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import styles from "./NationalRanking.module.css";

import { api } from "../../services/api";

import { useAuth } from "../../auth/AuthProvider";
import { getImageUrl } from "../../utils/image";

// =========================================
// TIPO DA LOJA
// =========================================

export type NationalRankingStore = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  verificationType?:
    | "BASIC"
    | "PREMIUM"
    | null;
};

// =========================================
// TIPO DO LEILÃO
// =========================================

export type NationalRankingAuction = {
  id: string;
  name: string;
  type?: "NORMAL" | "AUCTION";

  price?: number | null;

  auctionStartPrice?: number | null;

  currentBid?: number | null;

  minimumIncrement?: number | null;

  auctionStartsAt?: string | null;

  auctionEndsAt?: string | null;

  auctionClosed?: boolean;

  closedAt?: string | null;

  finalPrice?: number | null;

  imageUrl?: string | null;
};

// =========================================
// TIPO DA POSIÇÃO
// =========================================

export type NationalRankingPosition = {
  position: number;

  store?: NationalRankingStore | null;

  auctionProduct?:
    | NationalRankingAuction
    | null;
};

// =========================================
// PROPS
// =========================================

type NationalRankingProps = {
  /**
   * País do ranking.
   *
   * Se for informado, usamos esse país.
   *
   * Se não for informado, usamos
   * automaticamente o countryCode do
   * usuário autenticado.
   */
  countryCode?: string;
};

// =========================================
// POSIÇÕES PADRÃO
// =========================================

const DEFAULT_POSITIONS:
  NationalRankingPosition[] =
  Array.from(
    { length: 10 },
    (_, index) => ({
      position: index + 1,
      store: null,
      auctionProduct: null,
    }),
  );

// =========================================
// LABEL DA POSIÇÃO
// =========================================

function getPositionLabel(
  position: number,
) {
  switch (position) {
    case 1:
      return "🥇";

    case 2:
      return "🥈";

    case 3:
      return "🥉";

    default:
      return `${position}º`;
  }
}

// =========================================
// FORMATAR DATA
// =========================================

function formatAuctionDate(
  value?: string | null,
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date.toLocaleDateString(
    "pt-PT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
}

// =========================================
// FORMATAR PREÇO
// =========================================

function formatPrice(
  value?: number | null,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return new Intl.NumberFormat(
    "pt-MZ",
    {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
    },
  ).format(value);
}

// =========================================
// COMPONENTE
// =========================================

export default function NationalRanking({
  countryCode,
}: NationalRankingProps) {

  const navigate =
    useNavigate();

  // =======================================
  // USUÁRIO AUTENTICADO
  // =======================================

  const { user } = useAuth();

  // =========================================
  // PAÍS DO RANKING
  // =========================================
  //
  // Prioridade:
  //
  // 1. countryCode recebido por prop
  // 2. countryCode do usuário autenticado
  // 3. vazio enquanto ainda não disponível
  //
  // =========================================

  const rankingCountry =
    countryCode ??
    user?.countryCode ??
    "";

  const normalizedCountry =
    rankingCountry
      .trim()
      .toUpperCase();

  // =======================================
  // POSIÇÕES
  // =======================================

  const [
    positions,
    setPositions,
  ] = useState<
    NationalRankingPosition[]
  >(
    DEFAULT_POSITIONS,
  );

  // =======================================
  // LOADING
  // =======================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  // =======================================
  // ERRO
  // =======================================

  const [
    error,
    setError,
  ] = useState(false);

  // =======================================
  // MODAL
  // =======================================

  const [
    infoOpen,
    setInfoOpen,
  ] = useState(false);

  // =========================================
  // BUSCAR RANKING
  // =========================================

  useEffect(() => {

    // =======================================
    // PAÍS AINDA NÃO DISPONÍVEL
    // =======================================

    if (!normalizedCountry) {

      setLoading(true);

      setPositions(
        DEFAULT_POSITIONS,
      );

      return;
    }

    let cancelled = false;

    async function loadRanking() {

      try {

        setLoading(true);
        setError(false);

        const response =
          await api.get(
            "/ranking/national",
            {
              params: {
                countryCode:
                  normalizedCountry,
              },
            },
          );

        if (cancelled) {
          return;
        }

        const data =
          Array.isArray(
            response.data,
          )
            ? response.data
            : [];

        // ===================================
        // GARANTIR 10 POSIÇÕES
        // ===================================

        const normalizedPositions =
          Array.from(
            { length: 10 },
            (_, index) => {

              const position =
                index + 1;

              return (
                data.find(
                  (
                    item: NationalRankingPosition,
                  ) =>
                    item.position ===
                    position,
                ) ?? {
                  position,
                  store: null,
                  auctionProduct:
                    null,
                }
              );
            },
          );

        setPositions(
          normalizedPositions,
        );

      } catch (err) {

        if (cancelled) {
          return;
        }

        setError(true);

        setPositions(
          DEFAULT_POSITIONS,
        );

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }
    }

    loadRanking();

    return () => {
      cancelled = true;
    };

  }, [normalizedCountry]);

  // =========================================
  // IR PARA A BANCA
  // =========================================

  function handleStoreClick(
    storeId: string,
  ) {

    navigate(
      `/stores/${storeId}`,
    );

  }

  // =========================================
  // IR PARA LEILÃO
  // =========================================

  function handleAuctionClick(
    auctionId: string,
  ) {

    navigate(
      `/ranking/national/auction/${auctionId}`,
    );

  }

  // =========================================
  // IR PARA LISTA DE LEILÕES
  // =========================================

  function handleAuctionsListClick() {

    navigate(
      `/ranking/national/auctions?countryCode=${normalizedCountry}`,
    );

  }

  // =========================================
  // PAÍS AINDA CARREGANDO
  // =========================================

  if (!normalizedCountry) {

    return (
      <div
        className={
          styles.ranking
        }
      >

        <div
          className={
            styles.rankingActions
          }
        >

          <button
            type="button"
            className={
              styles.infoButton
            }
            onClick={() =>
              setInfoOpen(true)
            }
          >

            <span>
              Quer que sua loja participe
              do ranking?
            </span>

            <span
              className={
                styles.infoArrow
              }
            >
              →
            </span>

          </button>

        </div>

        <div
          className={
            styles.loading
          }
        >
          Carregando país do usuário...
        </div>

      </div>
    );
  }

  // =========================================
  // LOADING
  // =========================================

  if (loading) {

    return (
      <div
        className={
          styles.ranking
        }
      >

        <div
          className={
            styles.rankingActions
          }
        >

          <button
            type="button"
            className={
              styles.infoButton
            }
            onClick={() =>
              setInfoOpen(true)
            }
          >

            <span>
              Quer que sua loja participe
              do ranking?
            </span>

            <span
              className={
                styles.infoArrow
              }
            >
              →
            </span>

          </button>

        </div>

        <div
          className={
            styles.loading
          }
        >
          Carregando ranking...
        </div>

      </div>
    );
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <>
      <div
        className={
          styles.ranking
        }
      >

        {/* =================================
            AÇÕES DO RANKING
        ================================= */}

        <div
          className={
            styles.rankingActions
          }
        >

          {/* ================================
              CONVITE
          ================================= */}

          <button
            type="button"
            className={
              styles.infoButton
            }
            onClick={() =>
              setInfoOpen(true)
            }
          >

            <span>
              Quer que sua loja participe
              do ranking?
            </span>

            <span
              className={
                styles.infoArrow
              }
            >
              →
            </span>

          </button>

          {/* ================================
              TODOS OS LEILÕES
          ================================= */}

        </div>

        {/* =================================
            AVISO DE ERRO
        ================================= */}

        {error && (
          <div
            className={
              styles.error
            }
          >
            Não foi possível atualizar
            o ranking.
          </div>
        )}

        {/* =================================
            POSIÇÕES
        ================================= */}

        {positions.map(
          (item) => {

            const store =
              item.store;

            const auction =
              item.auctionProduct;

            const positionClass =
              item.position <= 3
                ? `${styles.position} ${styles[`position${item.position}`]}`
                : styles.position;

            return (
              <div
                key={
                  item.position
                }
                className={
                  positionClass
                }
              >

                {/* =========================
                    POSIÇÃO
                ========================= */}

                <div
                  className={
                    styles.positionNumber
                  }
                >

                  <span>
                    {getPositionLabel(
                      item.position,
                    )}
                  </span>

                </div>

                {/* =========================
                    LOJA
                ========================= */}

                {store ? (

                  <button
                    type="button"
                    className={
                      styles.store
                    }
                    onClick={() =>
                      handleStoreClick(
                        store.id,
                      )
                    }
                    aria-label={`Abrir banca ${store.name}`}
                  >

                    {/* AVATAR */}

                    <div
                      className={
                        styles.avatarWrapper
                      }
                    >

                      {store.avatarUrl ? (

                        <img
  src={getImageUrl(store.avatarUrl)}
  alt={store.name}
  className={styles.avatar}
/>

                      ) : (

                        <div
                          className={
                            styles.avatarPlaceholder
                          }
                        >
                          🏪
                        </div>

                      )}

                      {/* ===================
                          VERIFICAÇÃO
                      =================== */}

                      {store.verified &&
                        store.verificationType ===
                          "BASIC" && (

                        <span
                          title="Verificação Básica"
                          aria-label="Verificação Básica"
                          className={
                            styles.basicVerification
                          }
                        >
                          ✓
                        </span>

                      )}

                      {store.verified &&
                        store.verificationType ===
                          "PREMIUM" && (

                        <span
                          title="Verificação Premium"
                          aria-label="Verificação Premium"
                          className={
                            styles.premiumVerification
                          }
                        >
                          ★
                        </span>

                      )}

                    </div>

                    {/* INFORMAÇÕES */}

                    <div
                      className={
                        styles.storeInfo
                      }
                    >

                      <div
                        className={
                          styles.storeName
                        }
                      >
                        {store.name}
                      </div>

                      {store.verificationType ===
                        "PREMIUM" &&
                        store.verified && (

                        <span
                          className={
                            styles.premiumText
                          }
                        >
                          Loja Premium
                        </span>

                      )}

                      {store.verificationType ===
                        "BASIC" &&
                        store.verified && (

                        <span
                          className={
                            styles.basicText
                          }
                        >
                          Loja verificada
                        </span>

                      )}

                    </div>

                  </button>

                ) : (

                  <div
                    className={
                      styles.empty
                    }
                  >

                    <span>
                      Posição disponível
                    </span>

                  </div>

                )}

                {/* =========================
                    LEILÃO DA POSIÇÃO
                ========================= */}

                {auction && (

                  <button
                    type="button"
                    className={
                      styles.auctionButton
                    }
                    onClick={() =>
                      handleAuctionClick(
                        auction.id,
                      )
                    }
                    aria-label={`Ver leilão ${auction.name}`}
                  >

                    <span
                      className={
                        styles.auctionIcon
                      }
                    >
                      🔨
                    </span>

                    <span
                      className={
                        styles.auctionText
                      }
                    >
                      Ver leilão
                    </span>

                  </button>

                )}

              </div>
            );
          },
        )}

      </div>

      {/* =====================================
          MODAL / INFORMAÇÕES DO RANKING
      ===================================== */}

      {infoOpen && (

        <div
          className={
            styles.modalOverlay
          }
          onClick={() =>
            setInfoOpen(false)
          }
        >

          <div
            className={
              styles.modal
            }
            onClick={event =>
              event.stopPropagation()
            }
          >

            {/* ===============================
                CABEÇALHO
            =============================== */}

            <div
              className={
                styles.modalHeader
              }
            >

              <div>

                <h3>
                  Ranking Nacional
                </h3>

                <p>
                  Como participar
                </p>

              </div>

              <button
                type="button"
                className={
                  styles.modalClose
                }
                onClick={() =>
                  setInfoOpen(false)
                }
                aria-label="Fechar"
              >
                ×
              </button>

            </div>

            {/* ===============================
                CONTEÚDO
            =============================== */}

            <div
              className={
                styles.modalContent
              }
            >

              <p>
                O Ranking Nacional destaca
                as bancas participantes em
                posições especiais dentro
                do marketplace.
              </p>

              <p>
                Existem apenas{" "}
                <strong>
                  10 posições
                </strong>{" "}
                no ranking.
              </p>

              <p>
                Cada posição pode possuir
                um leilão próprio. O leilão
                registra os lances e o
                vencedor. A atribuição da
                posição é realizada
                separadamente pela gestão
                do Ranking Nacional.
              </p>

              <div
                className={
                  styles.modalSection
                }
              >

                <h4>
                  Como funciona?
                </h4>

                <div
                  className={
                    styles.modalSteps
                  }
                >

                  <div
                    className={
                      styles.modalStep
                    }
                  >

                    <span>
                      1
                    </span>

                    <p>
                      Consulte as posições
                      e os leilões disponíveis.
                    </p>

                  </div>

                  <div
                    className={
                      styles.modalStep
                    }
                  >

                    <span>
                      2
                    </span>

                    <p>
                      Acesse o leilão da
                      posição que deseja
                      acompanhar.
                    </p>

                  </div>

                  <div
                    className={
                      styles.modalStep
                    }
                  >

                    <span>
                      3
                    </span>

                    <p>
                      Participe do leilão
                      usando uma banca elegível.
                    </p>

                  </div>

                  <div
                    className={
                      styles.modalStep
                    }
                  >

                    <span>
                      4
                    </span>

                    <p>
                      O resultado do leilão
                      é registrado separadamente
                      da atribuição da posição.
                    </p>

                  </div>

                </div>

              </div>

              {/* =============================
                  LEILÕES
              ============================= */}

              <div
                className={
                  styles.modalSection
                }
              >

                <h4>
                  Leilões das posições
                </h4>

                <div
                  className={
                    styles.auctionList
                  }
                >

                  {positions.map(
                    item => {

                      const auction =
                        item.auctionProduct;

                      const store =
                        item.store;

                      if (!auction) {

                        return (
                          <div
                            key={
                              item.position
                            }
                            className={
                              styles.auctionRow
                            }
                          >

                            <div
                              className={
                                styles.auctionRowPosition
                              }
                            >
                              {getPositionLabel(
                                item.position,
                              )}
                            </div>

                            <div
                              className={
                                styles.auctionUnavailable
                              }
                            >
                              Leilão ainda não
                              configurado
                            </div>

                          </div>
                        );
                      }

                      const startDate =
                        formatAuctionDate(
                          auction.auctionStartsAt,
                        );

                      const endDate =
                        formatAuctionDate(
                          auction.auctionEndsAt,
                        );

                      const currentBid =
                        formatPrice(
                          auction.currentBid,
                        );

                      return (
                        <div
                          key={
                            item.position
                          }
                          className={
                            styles.auctionRow
                          }
                        >

                          <div
                            className={
                              styles.auctionRowPosition
                            }
                          >
                            {getPositionLabel(
                              item.position,
                            )}
                          </div>

                          <div
                            className={
                              styles.auctionRowInfo
                            }
                          >

                            <strong>
                              {auction.name}
                            </strong>

                            {store && (
                              <span>
                                Posição ocupada por{" "}
                                {
                                  store.name
                                }
                              </span>
                            )}

                            {currentBid && (
                              <span>
                                Lance atual:{" "}
                                {
                                  currentBid
                                }
                              </span>
                            )}

                            {(startDate ||
                              endDate) && (

                              <span>

                                {startDate &&
                                  `Início: ${startDate}`}

                                {startDate &&
                                  endDate &&
                                  " • "}

                                {endDate &&
                                  `Fim: ${endDate}`}

                              </span>

                            )}

                          </div>

                          <button
                            type="button"
                            className={
                              styles.modalAuctionButton
                            }
                            onClick={() =>
                              handleAuctionClick(
                                auction.id,
                              )
                            }
                          >
                            Ver leilão
                          </button>

                        </div>
                      );
                    },
                  )}

                </div>

              </div>

              {/* =============================
                  VER TODOS
              ============================= */}

              <div
                className={
                  styles.modalSection
                }
              >

                <button
                  type="button"
                  className={
                    styles.auctionsListButton
                  }
                  onClick={() => {
                    setInfoOpen(false);
                    handleAuctionsListClick();
                  }}
                >

                  <span>
                    🔨
                  </span>

                  <span>
                    Ver todos os leilões
                  </span>

                  <span>
                    →
                  </span>

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </>
  );
}