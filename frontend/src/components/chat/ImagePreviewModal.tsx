type Props = {
  imageUrl: string | null;
  onClose: () => void;
};

export function ImagePreviewModal({
  imageUrl,
  onClose,
}: Props) {
  if (!imageUrl) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
    >
      <img
        src={imageUrl}
        onClick={(e) =>
          e.stopPropagation()
        }
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          borderRadius: 14,
        }}
      />

      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: 32,
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </div>
  );
}