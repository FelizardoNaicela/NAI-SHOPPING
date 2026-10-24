import { useNavigate } from 'react-router-dom';
import type {
  Product,
  Post,
} from './types';

type Props = {
  product?: Product | null;
  post?: Post | null;
};

export function SharedLinkBubble({
  product,
  post,
}: Props) {

  const navigate = useNavigate();

  if (product) {

    const isAuction =
        product.type === "AUCTION";

        const cover =
    product.images?.[0]?.url ??
    product.imageUrl;

    return (
      <div
        onClick={() =>
          navigate(`/product/${product.id}`)
        }
        style={{
          borderLeft: "4px solid var(--primary)",
background: "var(--surface-soft)",
border: "1px solid var(--border)",
boxShadow: "var(--shadow-sm)",
transition: "all .25s ease",
          borderRadius: 10,
          padding: 10,
          cursor: 'pointer',
        }}

        onMouseEnter={(e)=>{
    e.currentTarget.style.transform="translateY(-2px)";
    e.currentTarget.style.boxShadow="var(--shadow-md)";
}}

onMouseLeave={(e)=>{
    e.currentTarget.style.transform="translateY(0)";
    e.currentTarget.style.boxShadow="var(--shadow-sm)";
}}
      >
        <div
          style={{
            fontSize: 12,
            color: "var(--primary)",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {isAuction
    ? "🏷 Leilão compartilhado"
    : "🛍 Produto compartilhado"}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >

    {cover && (
    <img
        src={`http://localhost:3000${cover}`}
              style={{
                width: 54,
                height: 54,
                borderRadius: 10,
                objectFit: 'cover',
              }}
            />
          )}

          <div>
            <div
              style={{
                fontWeight: 600,
              }}
            >
              {product.name}
            </div>

            <div
              style={{
                fontSize: 12,
               color: "var(--text-soft)",
              }}
            >
              {product.store?.name}
            </div>

            {product.price != null && (
              <div
                style={{
                  marginTop: 4,
                  fontWeight: 700,
color: "var(--text)",
                }}
              >
                {
isAuction
    ? `Lance atual: ${product.currentBid ?? product.auctionStartPrice} MT`
    : `${product.price} MT`
}
              </div>
            )}
          </div>
        </div>
      </div>
    );

  }

  if (post) {

    return (
      <div
        onClick={() =>
          navigate(`/post/${post.id}`)
        }
        style={{
          borderLeft: "4px solid var(--primary)",
background: "var(--surface-soft)",
border: "1px solid var(--border)",
boxShadow: "var(--shadow-sm)",
transition: "all .25s ease",
          borderRadius: 10,
          padding: 10,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            fontSize: 12,
            color:"var(--primary)",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          📰 Publicação compartilhada
        </div>

        <div
          style={{
            fontWeight: 600,
          }}
        >
          {post.content || 'Publicação'}
        </div>

        <div
          style={{
            fontSize: 12,
            color:"var(--text-soft)",
            marginTop: 4,
          }}
        >
          {post.store?.name}
        </div>
      </div>
    );

  }

  return null;
}