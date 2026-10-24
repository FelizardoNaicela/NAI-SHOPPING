import { ZoomableImage } from "./ZoomableImage";

type Props = {
    src: string | null;
    onClose(): void;
};

export function FullscreenImage({
    src,
    onClose,
}: Props) {

    if (!src) return null;

    return (

        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.95)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                padding: 20,
            }}
        >

            <ZoomableImage
                src={src}
                style={{
                    maxWidth: "90%",
                    maxHeight: "90%",
                    objectFit: "contain",
                }}
            />

            <button
                onClick={onClose}
                style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    fontSize: 34,
                    color: "#fff",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                }}
            >
                ×
            </button>

        </div>

    );
}