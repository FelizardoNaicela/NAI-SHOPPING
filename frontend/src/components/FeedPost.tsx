import { useState, useRef, useEffect } from "react";
import type { BackendPost } from "../services/feed";
import SmartImage from "./SmartImage";
import ImageLightbox from "./ImageLightbox";
import ProductCard from "./ProductCard";
import { useNavigate } from "react-router-dom";
import PostImageGrid from "./PostImageGrid";
import { MessageCircle } from "lucide-react";
import { api } from "../services/api";
import ShareButton from "./share/ShareButton";
import ShareModal from "./share/ShareModal";
import VerificationBadge from "./VerificationBadge";
import StoreTypeBadge from "./store/StoreTypeBadge";

type Props = {
  post: BackendPost;
};

export default function FeedPost({ post, }: Props) {

  const images =
  post.images
    ?.slice()
    .sort((a, b) => a.order - b.order) || [];

const isTextOnlyPost =
  !post.product && images.length === 0;

// Limite quando o texto está fechado
const textCollapsedLines = isTextOnlyPost ? 6 : 1;

// Limite máximo quando o texto está expandido
const textExpandedLines = isTextOnlyPost ? 20 : 4;

const textLineHeight = isTextOnlyPost ? 1.7 : 1.6;

const [index, setIndex] =
  useState(0);

const [lightboxOpen, setLightboxOpen] =
  useState(false);

const [shareOpen, setShareOpen] =
  useState(false);

const [textExpanded, setTextExpanded] =
  useState(false);

const [textOverflow, setTextOverflow] =
  useState(false);

const textRef =
  useRef<HTMLDivElement>(null);

const navigate = useNavigate();

const startX =
  useRef<number | null>(null);

  const hasMultiple = images.length > 1;

 useEffect(() => {
  const element = textRef.current;

  if (!element || !post.content) {
    setTextOverflow(false);
    return;
  }

  const lineHeight =
    parseFloat(
      getComputedStyle(element).lineHeight
    );

  const maxHeight =
  textCollapsedLines * lineHeight;

setTextOverflow(
  element.scrollHeight > maxHeight + 1
);
}, [
  post.content,
  setTextOverflow,
]);

  function next() {
    setIndex((i) => (i + 1) % images.length);
  }

  function prev() {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {

    if (startX.current === null) return;

    const diff = e.changedTouches[0].clientX - startX.current;

    if (diff > 50) prev();
    if (diff < -50) next();

    startX.current = null;
  }

  const productImages =
  post.product?.images?.length
    ? post.product.images
    : images;

    async function startChatFromPost(
  e: React.MouseEvent,
) {
  e.stopPropagation();

  const { data } = await api.post(
    `/chat/conversation/${post.store?.id}`
  );

  localStorage.setItem(
    "activeConversationId",
    data.id
  );

  localStorage.setItem(
    "pendingSharedPostId",
    post.id
  );

  navigate("/inbox");
}

  return (

    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        background:"var(--surface-glass)",
backdropFilter:"blur(10px)",
border:"1px solid var(--border)",
      }}
    >

      {/* HEADER */}

 <div
  onClick={() => navigate(`/stores/${post.store?.id}`)}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
    cursor: "pointer"
  }}
>
  <ShareButton
    onClick={() => setShareOpen(true)}
/>
   <button
        onClick={startChatFromPost}
        style={{
            width:34,
            height:34,
            borderRadius:"50%",
            border:"none",
            background:"var(--surface)",
            cursor:"pointer",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            boxShadow:"var(--shadow-md)"
        }}
    >
        <MessageCircle size={17}/>
    </button>

  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: "50%",
      overflow: "hidden",
      background:"var(--background)"
    }}
  >

    <SmartImage
  src={post.store?.avatarUrl ?? undefined}
  aspectRatio="1 / 1"
/>

  </div>

  <div style={{ flex: 1 }}>

    <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
  {post.store?.name || "Banca"}

  <VerificationBadge
    type={post.store?.verificationType}
    verified={post.store?.verified}
    size="sm"
  />
</div>

{post.store?.type && (
  <div style={{ marginTop: 2 }}>
    <StoreTypeBadge type={post.store.type} />
  </div>
)}

    <div
      style={{
        fontSize: 12,
        color:"var(--text-soft)",
      }}
    >
      {new Date(post.createdAt).toLocaleString()}
    </div>

  </div>

</div>

 {/* TEXTO */}

{post.content && (
  <div
    style={{
      padding: isTextOnlyPost
        ? "48px 32px"
        : "0 16px 16px",

      minHeight: isTextOnlyPost
        ? 220
        : undefined,

      display: "flex",

      alignItems: isTextOnlyPost
        ? "center"
        : "flex-start",

      justifyContent: isTextOnlyPost
        ? "center"
        : "flex-start",

      textAlign: isTextOnlyPost
        ? "center"
        : "left",

      color: "var(--text)",

      fontSize: isTextOnlyPost
        ? 20
        : 15,

      lineHeight: textLineHeight,

      fontWeight: isTextOnlyPost
        ? 500
        : 400,

      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}
  >

    <div
      style={{
        width: "100%",

        maxWidth: isTextOnlyPost
          ? 720
          : undefined,

        margin: "0 auto",
      }}
    >

      {/* ÁREA DO TEXTO */}

      <div
        style={{
          position: "relative",

          /*
           * Fechado:
           * 6 linhas para texto puro
           * 1 linha para publicação com imagem/produto
           */
          maxHeight: !textExpanded
            ? `${textCollapsedLines * textLineHeight}em`
            : `${textExpandedLines * textLineHeight}em`,

          /*
           * IMPORTANTE:
           * quando expandido, o texto NÃO cresce
           * indefinidamente.
           */
          overflowY: textExpanded
            ? "auto"
            : "hidden",

          overflowX: "hidden",

          transition:
            "max-height 0.25s ease",

          paddingRight:
            !textExpanded && textOverflow
              ? 75
              : 0,

          /*
           * Permite que o texto longo seja rolado
           * dentro do próprio post.
           */
          scrollbarWidth: "thin",
        }}
      >

        <div
          ref={textRef}
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {post.content}
        </div>

        {/* VER MAIS */}

        {!textExpanded && textOverflow && (
          <button
            type="button"
            onClick={() => setTextExpanded(true)}
            style={{
              position: "absolute",

              right: 0,
              bottom: 0,

              padding: "0 0 0 8px",

              border: "none",

              background:
                "var(--surface-glass)",

              color:
                "var(--primary)",

              fontSize:
                isTextOnlyPost
                  ? 16
                  : 14,

              fontWeight: 600,

              lineHeight:
                textLineHeight,

              cursor: "pointer",

              whiteSpace: "nowrap",
            }}
          >
            Ver mais
          </button>
        )}

      </div>

      {/* VER MENOS */}

      {textExpanded && textOverflow && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >

          <button
            type="button"
            onClick={() => setTextExpanded(false)}
            style={{
              padding: 0,

              border: "none",

              background: "transparent",

              color:
                "var(--primary)",

              fontSize: 14,

              fontWeight: 600,

              cursor: "pointer",
            }}
          >
            Ver menos
          </button>

        </div>
      )}

    </div>

  </div>
)}

      {/* IMAGENS */}

      {images.length > 0 && (

  post.product ? (

    <PostImageGrid
  images={productImages}
  productId={post.product?.id}
/>
  ) : (

    <div
      style={{ position: "relative", cursor: "zoom-in" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={() => setLightboxOpen(true)}
    >

      <SmartImage
        src={images[index]?.url}
        aspectRatio="auto"
        fit="contain"
      />


          {/* clique esquerda */}

          {hasMultiple && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "40%",
              }}
            />
          )}

          {/* clique direita */}

          {hasMultiple && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: "40%",
              }}
            />
          )}

          {/* indicadores */}

          {hasMultiple && (
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 6,
              }}
            >
              {images.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      i === index
                        ? "#fff"
                        : "rgba(255,255,255,0.5)",
                  }}
                />
              ))}
            </div>
          )}

        </div>

      ))}

      {/* PRODUTO PROMOVIDO */}

      {post.product && (
  <ProductCard product={post.product} />
)}
      {/* LIGHTBOX */}

      {lightboxOpen && (
        <ImageLightbox
          images={images.map((i) => i.url || "")}
          index={index}
          onClose={() => setLightboxOpen(false)}
          onNext={next}
          onPrev={prev}
        />
      )}



<ShareModal
    open={shareOpen}
    type="post"
    id={post.id}
    shareUrl={`${window.location.origin}/posts/${post.id}`}
    onClose={() => setShareOpen(false)}
/>
    </div>

  );
}