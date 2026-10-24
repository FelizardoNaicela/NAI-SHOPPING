import {
  useEffect,
  useState,
  useCallback,
} from "react";

import { listGlobalFeed } from "../services/feed";
import type { BackendPost } from "../services/feed";

import FeedPost from "./FeedPost";
import RegionSelector from "./RegionSelector";
import PromotionFeedSlots from "./PromotionFeedSlots";

const PAGE_SIZE = 100;

function createFeedSeed() {
  return `${Date.now()}-${Math.random()}`;
}

export default function GlobalFeed() {
  const [posts, setPosts] =
    useState<BackendPost[]>([]);

  const [cursor, setCursor] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(true);

  /**
   * Seed das promoções deste feed.
   *
   * Mantemos o mesmo seed durante o scroll.
   * No refresh ele muda, fazendo as promoções
   * ocuparem uma nova ordem.
   */
  const [feedSeed, setFeedSeed] =
    useState(() => createFeedSeed());

  const loadFeed =
    useCallback(async () => {
      if (loading || !hasMore) {
        return;
      }

      setLoading(true);

      try {
        const res =
          await listGlobalFeed({
            cursor:
              cursor ??
              undefined,
            limit: 10,
          });

        setPosts(prev => {
          const ids =
            new Set(
              prev.map(
                post => post.id,
              ),
            );

          const newItems =
            res.data.filter(
              (
                post: BackendPost,
              ) =>
                !ids.has(
                  post.id,
                ),
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
      }
    }, [
      cursor,
      loading,
      hasMore,
    ]);

  /**
   * PRIMEIRO CARREGAMENTO
   */
  useEffect(() => {
    loadFeed();
  }, []);

  /**
   * SCROLL INFINITO
   */
  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight +
          window.scrollY >=
        document.body.offsetHeight -
          400
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
  }, [loadFeed]);

  /**
   * REFRESH
   *
   * Além de recarregar as publicações,
   * cria um novo seed para as promoções.
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
    /**
     * Novo seed = nova rotação
     * das promoções.
     */
    setFeedSeed(
      createFeedSeed(),
    );

    setPosts([]);
    setCursor(null);
    setHasMore(true);

    const res =
      await listGlobalFeed({
        limit: 10,
      });

    setPosts(res.data);

    setCursor(
      res.nextCursor,
    );

    setHasMore(
      !!res.nextCursor,
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
      <RegionSelector
        onChange={reloadFeed}
      />

      <PromotionFeedSlots
        items={posts}
        seed={feedSeed}
        renderItem={post => (
          <FeedPost
            post={post}
          />
        )}
      />

      {loading && (
        <p>
          Carregando…
        </p>
      )}

      {!hasMore && (
        <p
          style={{
            textAlign:
              "center",
          }}
        >
          Não tem mais publicações
        </p>
      )}
    </div>
  );
}