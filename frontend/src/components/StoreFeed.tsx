import { useEffect, useState, useCallback } from 'react';
import { listStoreFeed } from '../services/feed';
import type { BackendPost } from '../services/feed';
import FeedPost from './FeedPost';

type StoreFeedProps = {
  storeId: string;
};

export default function StoreFeed({ storeId }: StoreFeedProps) {
  const [posts, setPosts] = useState<BackendPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const res = await listStoreFeed(storeId, {
  cursor: cursor ?? undefined,
  limit: 10,
});


      setPosts(prev => {
        const ids = new Set(prev.map(p => p.id));
        const newItems = res.data.filter(
  (p: BackendPost) => !ids.has(p.id)
);
        return [...prev, ...newItems];
      });

      setCursor(res.nextCursor);
      if (!res.nextCursor) setHasMore(false);

    } finally {
      setLoading(false);
    }
  }, [storeId, cursor, loading, hasMore]);

  /* reset ao mudar de banca */
  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
  }, [storeId]);

  /* primeira carga */
  useEffect(() => {
    loadFeed();
  }, [storeId]);

  /* scroll infinito */
  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 300
      ) {
        loadFeed();
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [loadFeed]);

  if (!posts.length && loading) {
    return <p>Carregando publicações…</p>;
  }

  if (!posts.length && !loading) {
    return <p>Esta banca ainda não publicou nada.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {posts.map(post => (
        <FeedPost key={post.id} post={post} />
      ))}

      {loading && <p>Carregando mais…</p>}

      {!hasMore && (
        <p style={{ textAlign: 'center', color: '#888' }}>
          Sem mais publicações
        </p>
      )}
    </div>
  );
}
