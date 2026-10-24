import SmartImage from "./SmartImage";
import { useNavigate } from "react-router-dom";

type Props = {
  images: { url: string }[];
  productId?: string;
};

export default function PostImageGrid({ images, productId }: Props) {

  const navigate = useNavigate();

  const visible = images.slice(0, 4);
  const extra = images.length - 4;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 4,
        cursor: productId ? "pointer" : "default"
      }}
      onClick={() => {
        if (productId) navigate(`/products/${productId}`);
      }}
    >
      {visible.map((img, i) => {

        const isLast = i === 3 && extra > 0;

        return (
          <div
            key={i}
            style={{
              position: "relative"
            }}
          >
            <SmartImage
              src={img.url}
              aspectRatio="1 / 1"
              hoverZoom
            />

            {isLast && (
              <div
  style={{
    position: "absolute",
    inset: 0,

    background: "var(--overlay-dark)",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    color: "var(--text-on-dark)",

    fontSize: 22,
    fontWeight: 600,
  }}
>
    +{extra}
</div>
            )}

          </div>
        );
      })}
    </div>
  );
}