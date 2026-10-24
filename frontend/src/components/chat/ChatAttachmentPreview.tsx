type Props = {
  previewUrl: string | null;
  videoPreviewUrl: string |null;

  selectedFile: File | null;

  sendingImage: boolean;
  uploadProgress: number;

  setPreviewUrl: (
    value: string | null
  ) => void;

  setVideoPreviewUrl: (
    value: string | null
  ) => void;

  setSelectedFile: (
    file: File | null
  ) => void;

  sendImage: () => void;

  uploadVideo: (
    file: File
  ) => void;
};

export function ChatAttachmentPreview({
  previewUrl,
  videoPreviewUrl,

  selectedFile,

  sendingImage,
  uploadProgress,

  setPreviewUrl,
  setVideoPreviewUrl,
  setSelectedFile,

  sendImage,
  uploadVideo,
}: Props) {
  return (
    <>
      {/* ==========================
          PREVIEW IMAGEM
      ========================== */}

      {previewUrl && (
        <div
          style={{
            padding: 10,
            borderTop: "1px solid #ddd",
            background: "#fff",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "fit-content",
            }}
          >
            <img
              src={previewUrl}
              style={{
                maxWidth: 180,
                borderRadius: 12,
              }}
            />

            <button
              onClick={() => {
                setPreviewUrl(null);
                setSelectedFile(null);
              }}
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: "#111",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          <button
            onClick={sendImage}
            disabled={sendingImage}
            style={{
              marginTop: 10,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {sendingImage
              ? "Enviando..."
              : "Enviar imagem"}
          </button>

          {sendingImage && (
            <div
              style={{
                marginTop: 10,
              }}
            >
              <div
                style={{
                  height: 8,
                  background: "#e5e5e5",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: "100%",
                    background: "#22c55e",
                    transition: "0.2s",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#666",
                }}
              >
                {uploadProgress}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================
          PREVIEW VÍDEO
      ========================== */}

      {videoPreviewUrl && (
        <div
          style={{
            padding: 10,
            background: "#fff",
          }}
        >
          <video
            controls
            src={videoPreviewUrl}
            style={{
              maxWidth: 240,
              borderRadius: 12,
            }}
          />

          <button
            onClick={() => {
              if (!selectedFile) return;

              uploadVideo(selectedFile);

              setVideoPreviewUrl(null);
              setSelectedFile(null);
            }}
            style={{
              marginTop: 10,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Enviar vídeo
          </button>

          <button
            onClick={() => {
              setVideoPreviewUrl(null);
              setSelectedFile(null);
            }}
            style={{
              marginLeft: 10,
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}