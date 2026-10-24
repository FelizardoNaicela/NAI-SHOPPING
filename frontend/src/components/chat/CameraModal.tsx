import {
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  open: boolean;

  onClose: () => void;

  onCapturePhoto: (
    file: File
  ) => void;

  onCaptureVideo: (
    file: File
  ) => void;
};

export function CameraModal({
  open,
  onClose,
  onCapturePhoto,
  onCaptureVideo,
}: Props) {

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(
      null
    );

  const chunksRef =
    useRef<Blob[]>([]);

  const [
    stream,
    setStream,
  ] = useState<MediaStream | null>(
    null
  );

  const [
    recording,
    setRecording,
  ] = useState(false);

  useEffect(() => {

    if (!open) return;

    async function startCamera() {

      try {

        const mediaStream =
          await navigator
            .mediaDevices
            .getUserMedia({
              video: true,
              audio: true,
            });

        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject =
            mediaStream;
        }

      } catch (err) {
      }
    }

    startCamera();

    return () => {
      stream?.getTracks().forEach(
        (track) => track.stop()
      );
    };

  }, [open]);

  function capturePhoto() {

    if (!videoRef.current)
      return;

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      videoRef.current.videoWidth;

    canvas.height =
      videoRef.current.videoHeight;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(
      videoRef.current,
      0,
      0
    );

    canvas.toBlob((blob) => {

      if (!blob) return;

      const file = new File(
        [blob],
        `photo-${Date.now()}.png`,
        {
          type: "image/png",
        }
      );

      onCapturePhoto(file);

      onClose();

    }, "image/png");
  }

  function startVideoRecording() {

    if (!stream) return;

    chunksRef.current = [];

    const recorder =
      new MediaRecorder(stream);

    mediaRecorderRef.current =
      recorder;

    recorder.ondataavailable = (
      e
    ) => {
      if (e.data.size > 0) {
        chunksRef.current.push(
          e.data
        );
      }
    };

    recorder.onstop = () => {

      const blob = new Blob(
        chunksRef.current,
        {
          type: "video/webm",
        }
      );

      const file = new File(
        [blob],
        `video-${Date.now()}.webm`,
        {
          type: "video/webm",
        }
      );

      onCaptureVideo(file);

      onClose();
    };

    recorder.start();

    setRecording(true);
  }

  function stopVideoRecording() {

    mediaRecorderRef.current?.stop();

    setRecording(false);
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,0.8)",
        zIndex: 9999,

        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "90%",
          maxWidth: 500,
          borderRadius: 16,
        }}
      />

      <div
        style={{
          display: "flex",
          gap: 12,
        }}
      >
        <button
          onClick={capturePhoto}
        >
          📸 Foto
        </button>

        {!recording ? (
          <button
            onClick={
              startVideoRecording
            }
          >
            🎥 Gravar
          </button>
        ) : (
          <button
            onClick={
              stopVideoRecording
            }
          >
            ⏹️ Parar
          </button>
        )}

        <button
          onClick={onClose}
        >
          ✖
        </button>
      </div>
    </div>
  );
}