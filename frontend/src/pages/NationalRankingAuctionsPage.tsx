import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { api } from "../services/api";

import { COUNTRIES } from "../shared/regions";

import styles from "./NationalRankingAuctionsPage.module.css";
import FloatingDrawers from "../components/drawer/FloatingDrawers";


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


type Props = {
  countryCode?: string;
};


function getPositionLabel(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";

  return `${position}º`;
}


function formatPrice(value?: number | null) {
  if (value == null) {
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
    dateStyle: "short",
    timeStyle: "short",
  });
}


function getAuctionStatus(
  auction: NationalRankingAuction,
) {
  if (auction.closed) {
    return "ENCERRADO";
  }

  const now = Date.now();

  const startsAt =
    new Date(auction.startsAt).getTime();

  const endsAt =
    new Date(auction.endsAt).getTime();

  if (now < startsAt) {
    return "EM BREVE";
  }

  if (now >= endsAt) {
    return "A ENCERRAR";
  }

  return "ATIVO";
}


function getStatusClass(
  auction: NationalRankingAuction,
) {
  const status = getAuctionStatus(auction);

  if (status === "ENCERRADO") {
    return styles.statusClosed;
  }

  if (status === "EM BREVE") {
    return styles.statusUpcoming;
  }

  if (status === "A ENCERRAR") {
    return styles.statusEnding;
  }

  return styles.statusActive;
}


function getCurrentBid(
  auction: NationalRankingAuction,
) {
  return (
    auction.currentBid ??
    auction.startPrice
  );
}


function getNextBid(
  auction: NationalRankingAuction,
) {
  const currentBid =
    getCurrentBid(auction);

  const increment =
    auction.minimumIncrement ?? 0;

  return currentBid + increment;
}


/**
 * Converte a imagem do backend para uma URL utilizável
 * pelo navegador.
 *
 * Se já for uma URL absoluta (http/https), mantém.
 * Se for um caminho relativo, adiciona a origem da API.
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


export default function NationalRankingAuctionsPage({
  countryCode: propCountryCode,
}: Props) {

  const navigate = useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();


  const countryFromUrl =
    searchParams.get("countryCode");


  const countryCode =
    (
      propCountryCode ??
      countryFromUrl ??
      "MZ"
    )
      .trim()
      .toUpperCase();


  const [
    auctions,
    setAuctions,
  ] = useState<
    NationalRankingAuction[]
  >([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  useEffect(() => {

    if (!countryCode) {
      return;
    }


    let cancelled = false;


    async function loadAuctions() {

      try {

        setLoading(true);

        setError("");


        const response =
          await api.get(
            `/ranking/national/auctions/country/${countryCode}`,
          );


        if (cancelled) {
          return;
        }


        const data =
          Array.isArray(response.data)
            ? response.data
            : [];


        setAuctions(data);


      } catch (err) {

        if (cancelled) {
          return;
        }


        console.error(
          "Erro ao carregar leilões do Ranking Nacional:",
          err,
        );


        setError(
          "Não foi possível carregar os leilões do Ranking Nacional.",
        );


      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }


    loadAuctions();


    return () => {
      cancelled = true;
    };

  }, [countryCode]);


  async function handleRefresh() {

    try {

      setRefreshing(true);

      setError("");


      const response =
        await api.get(
          `/ranking/national/auctions/country/${countryCode}`,
        );



      const data =
        Array.isArray(response.data)
          ? response.data
          : [];


      setAuctions(data);


    } catch (err) {

      console.error(
        "Erro ao atualizar leilões:",
        err,
      );


      setError(
        "Não foi possível atualizar os leilões.",
      );


    } finally {

      setRefreshing(false);
    }

  }


  function handleCountryChange(
    value: string,
  ) {

    const normalized =
      value.trim().toUpperCase();


    if (!normalized) {
      return;
    }


    setSearchParams({
      countryCode: normalized,
    });

  }


  function handleAuctionClick(
    auctionId: string,
  ) {

    navigate(
      `/ranking/national/auction/${auctionId}`,
    );

  }


  const orderedAuctions =
    useMemo(() => {

      return [...auctions].sort(
        (a, b) =>
          a.position -
          b.position,
      );

    }, [auctions]);


  const activeCount =
    orderedAuctions.filter(
      auction =>
        getAuctionStatus(auction) ===
        "ATIVO",
    ).length;


  const upcomingCount =
    orderedAuctions.filter(
      auction =>
        getAuctionStatus(auction) ===
        "EM BREVE",
    ).length;


  const closedCount =
    orderedAuctions.filter(
      auction =>
        auction.closed,
    ).length;


  if (loading) {

    return (
      <div
        className={styles.page}
      >

        <div
          className={styles.loading}
        >

          <div
            className={
              styles.loadingSpinner
            }
          />

          <p>
            Carregando leilões
            do Ranking Nacional...
          </p>

        </div>

      </div>
    );

  }


  return (

    <div
      className={styles.page}
    >
        <FloatingDrawers/>

      {/* =====================================
          CABEÇALHO
      ===================================== */}

      <header
        className={styles.header}
      >

        <div>

          <div
            className={styles.eyebrow}
          >
            🔨 RANKING NACIONAL
          </div>


          <h1
            className={styles.title}
          >
            Leilões das posições
          </h1>


          <p
            className={styles.subtitle}
          >
            Participe dos leilões
            correspondentes às posições
            do Ranking Nacional.
          </p>

        </div>


        <button
          type="button"
          className={
            styles.refreshButton
          }
          onClick={handleRefresh}
          disabled={refreshing}
        >

          {refreshing
            ? "Atualizando..."
            : "↻ Atualizar"}

        </button>

      </header>


      {/* =====================================
          CONTROLO DO PAÍS
      ===================================== */}

      <section
        className={styles.countryBar}
      >

        <div
          className={styles.countryInfo}
        >

          <span
            className={
              styles.countryLabel
            }
          >
            País
          </span>


          <strong>
            {COUNTRIES.find(
              country =>
                country.code ===
                countryCode,
            )?.name ??
              countryCode}
          </strong>

        </div>


        <select
          value={countryCode}
          aria-label="Selecionar país"
          onChange={(event) =>
            handleCountryChange(
              event.target.value,
            )
          }
          className={
            styles.countryInput
          }
        >

          {COUNTRIES.map(
            country => (

              <option
                key={country.code}
                value={country.code}
              >
                {country.name}
              </option>

            ),
          )}

        </select>

      </section>


      {/* =====================================
          ERRO
      ===================================== */}

      {error && (

        <div
          className={styles.error}
        >

          <span>
            ⚠️
          </span>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* =====================================
          RESUMO
      ===================================== */}

      <section
        className={styles.summary}
      >

        <div
          className={
            styles.summaryCard
          }
        >

          <span>
            Leilões
          </span>

          <strong>
            {orderedAuctions.length}
          </strong>

        </div>


        <div
          className={
            styles.summaryCard
          }
        >

          <span>
            Ativos
          </span>

          <strong>
            {activeCount}
          </strong>

        </div>


        <div
          className={
            styles.summaryCard
          }
        >

          <span>
            Em breve
          </span>

          <strong>
            {upcomingCount}
          </strong>

        </div>


        <div
          className={
            styles.summaryCard
          }
        >

          <span>
            Encerrados
          </span>

          <strong>
            {closedCount}
          </strong>

        </div>

      </section>


      {/* =====================================
          INFORMAÇÃO
      ===================================== */}

      <div
        className={styles.info}
      >

        <span
          className={styles.infoIcon}
        >
          ℹ️
        </span>

        <p>
          Cada leilão corresponde a uma
          posição específica do Ranking
          Nacional. O resultado do leilão
          é registrado separadamente da
          atribuição da posição.
        </p>

      </div>


      {/* =====================================
          LISTA
      ===================================== */}

      {orderedAuctions.length === 0 ? (

        <div
          className={styles.empty}
        >

          <div
            className={
              styles.emptyIcon
            }
          >
            🔨
          </div>


          <h2>
            Nenhum leilão disponível
          </h2>


          <p>
            Ainda não existem leilões
            configurados para o país{" "}
            <strong>
              {COUNTRIES.find(
                country =>
                  country.code ===
                  countryCode,
              )?.name ??
                countryCode}
            </strong>.
          </p>

        </div>

      ) : (

        <section
          className={
            styles.auctionGrid
          }
        >

          {orderedAuctions.map(
            (auction) => {

              const status =
                getAuctionStatus(
                  auction,
                );


              const currentBid =
                getCurrentBid(
                  auction,
                );


              const nextBid =
                getNextBid(
                  auction,
                );


              const imageUrl =
                getImageUrl(
                  auction.imageUrl,
                );


              return (

                <article
                  key={auction.id}
                  className={`
                    ${styles.auctionCard}
                    ${
                      auction.position <= 3
                        ? styles.topPosition
                        : ""
                    }
                  `}
                >

                  {/* =================================
                      POSIÇÃO
                  ================================= */}

                  <div
                    className={
                      styles.positionHeader
                    }
                  >

                    <div
                      className={
                        styles.positionBadge
                      }
                    >

                      <span
                        className={
                          styles.positionMedal
                        }
                      >
                        {getPositionLabel(
                          auction.position,
                        )}
                      </span>

                      <span>
                        Posição{" "}
                        {auction.position}
                      </span>

                    </div>


                    <span
                      className={`
                        ${styles.status}
                        ${getStatusClass(
                          auction,
                        )}
                      `}
                    >
                      {status}
                    </span>

                  </div>


                  {/* =================================
                      IMAGEM
                  ================================= */}

                  <button
                    type="button"
                    className={
                      styles.imageButton
                    }
                    onClick={() =>
                      handleAuctionClick(
                        auction.id,
                      )
                    }
                    aria-label={
                      `Abrir leilão da posição ${auction.position}`
                    }
                  >

                    {imageUrl ? (

                      <img
                        src={imageUrl}
                        alt={
                          `Imagem do leilão da posição ${auction.position}`
                        }
                        className={
                          styles.auctionImage
                        }

                        /*
                         * Caso a imagem tenha sido
                         * removida ou esteja
                         * indisponível, voltamos
                         * automaticamente para
                         * o placeholder.
                         */
                        onError={(
                          event,
                        ) => {

                          const image =
                            event.currentTarget;

                          image.style.display =
                            "none";

                          const parent =
                            image.parentElement;

                          if (
                            parent &&
                            !parent.querySelector(
                              ".auction-image-fallback",
                            )
                          ) {

                            const fallback =
                              document.createElement(
                                "div",
                              );

                            fallback.className =
                              "auction-image-fallback";

                            fallback.style.width =
                              "100%";

                            fallback.style.height =
                              "100%";

                            fallback.style.display =
                              "flex";

                            fallback.style.flexDirection =
                              "column";

                            fallback.style.alignItems =
                              "center";

                            fallback.style.justifyContent =
                              "center";

                            fallback.style.gap =
                              "8px";

                            fallback.innerHTML = `
                              <span style="font-size: 42px;">
                                ${getPositionLabel(
                                  auction.position,
                                )}
                              </span>
                              <small>
                                Ranking Nacional
                              </small>
                            `;

                            parent.appendChild(
                              fallback,
                            );

                          }

                        }}
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

                        <small>
                          Ranking Nacional
                        </small>

                      </div>

                    )}

                  </button>


                  {/* =================================
                      CONTEÚDO
                  ================================= */}

                  <div
                    className={
                      styles.cardContent
                    }
                  >

                    <h2
                      className={
                        styles.auctionName
                      }
                    >
                      {auction.name}
                    </h2>


                    <div
                      className={
                        styles.positionDescription
                      }
                    >

                      Leilão da posição{" "}
                      <strong>
                        #{auction.position}
                      </strong>{" "}
                      do Ranking Nacional

                    </div>


                    {/* ===============================
                        VALORES
                    =============================== */}

                    <div
                      className={
                        styles.bidSection
                      }
                    >

                      <div
                        className={
                          styles.bidColumn
                        }
                      >

                        <span>
                          Lance atual
                        </span>

                        <strong
                          className={
                            styles.currentBid
                          }
                        >
                          {formatPrice(
                            currentBid,
                          )}
                        </strong>

                      </div>


                      {!auction.closed &&
                        auction.minimumIncrement !=
                          null && (

                        <div
                          className={
                            styles.bidColumn
                          }
                        >

                          <span>
                            Próximo lance
                          </span>

                          <strong>
                            {formatPrice(
                              nextBid,
                            )}
                          </strong>

                        </div>

                      )}

                    </div>


                    {/* ===============================
                        DATAS
                    =============================== */}

                    <div
                      className={
                        styles.dateInfo
                      }
                    >

                      <div>

                        <span>
                          Início
                        </span>

                        <strong>
                          {formatDate(
                            auction.startsAt,
                          )}
                        </strong>

                      </div>


                      <div>

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


                    {/* ===============================
                        RESERVA
                    =============================== */}

                    {auction.reservePrice !=
                      null && (

                      <div
                        style={{
                          marginTop: "10px",
                          fontSize: "0.85rem",
                          opacity: 0.8,
                        }}
                      >

                        <span>
                          Preço de reserva:{" "}
                        </span>

                        <strong>
                          {formatPrice(
                            auction.reservePrice,
                          )}
                        </strong>

                      </div>

                    )}


                    {/* ===============================
                        FINALIZADO
                    =============================== */}

                    {auction.closed && (

                      <div
                        className={
                          styles.closedInfo
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


                    {/* ===============================
                        BOTÃO
                    =============================== */}

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
                    >

                      <span>
                        🔨
                      </span>

                      <span>

                        {auction.closed
                          ? "Ver resultado"
                          : status === "EM BREVE"
                          ? "Ver leilão"
                          : "Participar do leilão"}

                      </span>

                    </button>

                  </div>

                </article>

              );

            },
          )}

        </section>

      )}


      {/* =====================================
          RODAPÉ INFORMATIVO
      ===================================== */}

      <section
        className={
          styles.footerInfo
        }
      >

        <h3>
          Sobre os leilões do Ranking Nacional
        </h3>


        <p>
          Os leilões são realizados
          individualmente para cada posição.
          A participação no leilão registra
          os lances e o resultado daquela
          posição.
        </p>


        <p>
          A atribuição efetiva da posição
          é realizada separadamente pela
          gestão do Ranking Nacional.
        </p>

      </section>

    </div>

  );

}