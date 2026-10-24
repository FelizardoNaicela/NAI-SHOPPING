import {
  useEffect,
  useState,
  useCallback,
} from "react";

import { listFollowingFeed } from "../services/feed";

import FeedPost from "./FeedPost";
import PromotionFeedSlots from "./PromotionFeedSlots";

const PAGE_SIZE = 100;

function createFeedSeed() {
  return `${Date.now()}-${Math.random()}`;
}

export default function FollowingFeed() {
  const [posts, setPosts] =
    useState<any[]>([]);

  const [cursor, setCursor] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(true);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const token =
    localStorage.getItem("token");

  /**
   * Seed das promoções deste feed.
   *
   * O seed permanece igual durante o scroll.
   * No refresh é criado um novo seed,
   * fazendo as promoções mudarem de ordem.
   *
   * Importante:
   * as promoções continuam sendo globais.
   * Elas NÃO ficam limitadas às bancas seguidas.
   */
  const [feedSeed, setFeedSeed] =
    useState(() => createFeedSeed());

  const loadFeed =
    useCallback(async () => {
      if (!token) return;

      if (loading || !hasMore) {
        return;
      }

      setLoading(true);

      try {
        const res =
          await listFollowingFeed({
            cursor:
              cursor ??
              undefined,
            limit: 10,
          });

        setPosts(prev => {
          const ids =
            new Set(
              prev.map(
                p => p.id,
              ),
            );

          const newItems =
            res.data.filter(
              (p: any) =>
                !ids.has(p.id),
            );

          const merged = [
            ...prev,
            ...newItems,
          ];

          return merged.slice(
            -PAGE_SIZE,
          );
        });

        setCursor(
          res.nextCursor,
        );

        if (!res.nextCursor) {
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    }, [
      cursor,
      loading,
      hasMore,
      token,
    ]);

  /**
   * PRIMEIRO CARREGAMENTO
   */
  useEffect(() => {
    if (!token) return;

    loadFeed();
  }, [token]);

  /**
   * SCROLL INFINITO
   */
  useEffect(() => {
    if (!token) return;

    const onScroll = () => {
      if (
        window.innerHeight +
          window.scrollY >=
        document.body.offsetHeight -
          600
      ) {
        loadFeed();
      }
    };

    window.addEventListener(
      "scroll",
      onScroll,
    );

    return () => {
      window.removeEventListener(
        "scroll",
        onScroll,
      );
    };
  }, [
    loadFeed,
    token,
  ]);

  /**
   * REFRESH
   *
   * Recarrega as publicações
   * e troca a rotação das promoções.
   */
  useEffect(() => {
    const refresh = () => {
      reloadFeed();
    };

    window.addEventListener(
      "home-refresh",
      refresh,
    );

    return () => {
      window.removeEventListener(
        "home-refresh",
        refresh,
      );
    };
  }, []);

  async function reloadFeed() {
    if (!token) return;

    /**
     * Novo seed = nova ordem
     * das promoções.
     */
    setFeedSeed(
      createFeedSeed(),
    );

    setPosts([]);
    setCursor(null);
    setHasMore(true);
    setInitialLoading(true);

    const res =
      await listFollowingFeed({
        limit: 10,
      });

    setPosts(res.data);

    setCursor(
      res.nextCursor,
    );

    setHasMore(
      !!res.nextCursor,
    );

    setInitialLoading(false);
  }

  if (!token) {
    return (
      <p>
        Faça login para ver o feed das bancas que segue
      </p>
    );
  }

  if (initialLoading) {
    return (
      <p>
        Carregando feed...
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <PromotionFeedSlots
        items={posts}
        seed={feedSeed}
        renderItem={(post) => (
          <FeedPost
            post={post}
          />
        )}
      />

      {posts.length === 0 && (
        <p
          style={{
            textAlign: "center",
          }}
        >
          Ainda não segues nenhuma banca
        </p>
      )}

      {loading && (
        <p>
          Carregando mais…
        </p>
      )}

      {!hasMore && (
        <p
          style={{
            textAlign: "center",
          }}
        >
          Não tem mais publicações
        </p>
      )}
    </div>
  );
}