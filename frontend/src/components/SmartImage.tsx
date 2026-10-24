import { useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL;

function normalizeSrc(src?: string | null) {
  if (!src) return src;

  // se já for URL completa → mantém
  if (src.startsWith('http')) return src;

  // se for relativa → adiciona backend
  return API_URL + src;
}

type Props = {
  src?: string | null;
  alt?: string;
  aspectRatio?: string;
  fit?: 'cover' | 'contain';
  hoverZoom?: boolean;
  enableFullscreen?: boolean;
  blurPreview?: string; // base64 opcional
};

export default function SmartImage({
  src,
  alt = 'Imagem',
  aspectRatio = 'auto',
  fit = 'cover',
  hoverZoom = false,
  enableFullscreen = false,
  blurPreview,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

const hasImage = src && !error;

const finalSrc = hasImage
  ? normalizeSrc(src)
  : null;

  return (
    <>
      <div
        style={{
          width: '100%',
          aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio,
          background: "var(--surface-secondary)",
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
          cursor: enableFullscreen ? 'zoom-in' : 'default',
        }}
        onClick={() => enableFullscreen && setFullscreen(true)}
      >
        {/* blur preview */}
        {blurPreview && !loaded && (
          <img
            src={blurPreview}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: fit,
              filter: 'blur(20px)',
              transform: 'scale(1.1)',
            }}
          />
        )}

        {/* skeleton shimmer */}
        {!loaded && !blurPreview && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
             background:
"linear-gradient(90deg,var(--surface-secondary) 25%, var(--surface-hover) 37%, var(--surface-secondary) 63%)",
              backgroundSize: '400% 100%',
              animation: 'skeleton 1.4s ease infinite',
            }}
          />
        )}

        {finalSrc ? (
  <img
    src={finalSrc}
    alt={alt}
    loading="lazy"
    decoding="async"
    onLoad={() => setLoaded(true)}
    onError={() => setError(true)}
    style={{
      width: '100%',
      height: '100%',
      objectFit: fit,
      opacity: loaded ? 1 : 0,
      willChange: 'transform',
      transition: 'opacity .35s ease, transform .4s ease',
    }}
    onMouseEnter={e => {
      if (hoverZoom) e.currentTarget.style.transform = 'scale(1.08)';
    }}
    onMouseLeave={e => {
      if (hoverZoom) e.currentTarget.style.transform = 'scale(1)';
    }}
  />
) : (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: "var(--text-soft)",
      fontSize: 13,
      background: "var(--surface-secondary)",
    }}
  >
    <div style={{ fontSize: 28 }}>🖼️</div>
    <div>sem imagem</div>
  </div>
)}

        <style>
          {`
          @keyframes skeleton {
            0% { background-position: 100% 50%; }
            100% { background-position: 0 50%; }
          }
          `}
        </style>
      </div>

      {/* FULLSCREEN MODAL */}
      {enableFullscreen && fullscreen && (
        <div
          onClick={() => setFullscreen(false)}
          style={{
            position: 'fixed',
            inset: 0,
           background: "color-mix(in srgb, var(--background) 88%, black)",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out',
          }}
        >
          {finalSrc ? (
  <img
    src={finalSrc}
    alt={alt}
    loading="lazy"
    decoding="async"
    onLoad={() => setLoaded(true)}
    onError={() => setError(true)}
    style={{
      width: '100%',
      height: '100%',
      objectFit: fit,
      opacity: loaded ? 1 : 0,
      willChange: 'transform',
      transition: 'opacity .35s ease, transform .4s ease',
    }}
    onMouseEnter={e => {
      if (hoverZoom) e.currentTarget.style.transform = 'scale(1.08)';
    }}
    onMouseLeave={e => {
      if (hoverZoom) e.currentTarget.style.transform = 'scale(1)';
    }}
  />
) : (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: '#aaa',
      fontSize: 13,
      background: "var(--surface-secondary)",
    }}
  >
    <div style={{ fontSize: 28 }}>🖼️</div>
    <div>sem imagem</div>
  </div>
)}
        </div>
      )}
    </>
  );
}
