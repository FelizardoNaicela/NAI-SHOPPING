import { useEffect } from "react";

type Props = {
    video: {
        src: string;
        poster?: string | null;
    } | null;

    onClose(): void;
};

export default function FullscreenVideo({
    video,
    onClose,
}: Props) {
    useEffect(() => {
        if (!video) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handler);

        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [video, onClose]);

    if (!video) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.96)",
                zIndex: 999999,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
            }}
        >
            <video
                controls
                autoPlay
                poster={video.poster ?? undefined}
                src={video.src}
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: "95vw",
                    maxHeight: "95vh",
                    borderRadius: 12,
                    background: "#000",
                }}
            />
        </div>
    );
}