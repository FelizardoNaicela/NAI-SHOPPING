import { getImageUrl } from "../../utils/image";

type AvatarProps = {
  src?: string | null;
  name?: string;
  size?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
};

export default function Avatar({
  src,
  name,
  size = 42,
  onClick,
  style,
}: AvatarProps) {
  const initial =
    name?.trim()?.charAt(0)?.toUpperCase() ?? "U";

  if (src) {
    return (
      <img
        src={getImageUrl(src)}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          cursor: onClick ? "pointer" : "default",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#f97316",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.42,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        ...style,
      }}
    >
      {initial}
    </div>
  );
}