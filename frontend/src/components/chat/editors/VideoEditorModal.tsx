import {
  useEffect,
  useRef,
  useState,
} from "react";
import { FFmpeg }
from "@ffmpeg/ffmpeg";

import {
  fetchFile,
}
from "@ffmpeg/util";

type Props = {
  videoUrl: string;

  onClose: () => void;

  onConfirm: (
    file: File
  ) => void;
};

export function VideoEditorModal({
  videoUrl,
  onClose,
  onConfirm,
}: Props) {

  const videoRef =
  useRef<HTMLVideoElement | null>(null);

  const [
    duration,
    setDuration,
  ] = useState(0);

  const [
    startTime,
    setStartTime,
  ] = useState(0);

  const [
    endTime,
    setEndTime,
  ] = useState(0);

  const ffmpegRef =
  useRef(new FFmpeg());

  useEffect(() => {

    setEndTime(duration);

  }, [duration]);

  async function handleConfirm() {

  try {
    const ffmpeg =
      ffmpegRef.current;

    if (!ffmpeg.loaded) {
  await ffmpeg.load();
}

    const videoData =
      await fetchFile(videoUrl);

    await ffmpeg.writeFile(
      "input.mp4",
      videoData
    );

    const cutDuration =
      endTime - startTime;

    await ffmpeg.exec([
  "-ss",
  String(startTime),

  "-i",
  "input.mp4",

  "-t",
  String(cutDuration),

  "-c:v",
  "libx264",

  "-c:a",
  "aac",

  "-preset",
  "ultrafast",

  "output.mp4",
]);

    const data =
      await ffmpeg.readFile(
        "output.mp4"
      );

    if (
      typeof data === "string"
    ) {

      throw new Error(
        "Erro ao processar vídeo"
      );
    }

    const uint8Array =
  data as Uint8Array;

const arrayBuffer =
  uint8Array.buffer.slice(
    uint8Array.byteOffset,
    uint8Array.byteOffset +
      uint8Array.byteLength
  ) as ArrayBuffer;

const blob =
  new Blob(
    [arrayBuffer],
    {
      type: "video/mp4",
    }
  );

    const file =
      new File(
        [blob],
        "edited-video.mp4",
        {
          type: "video/mp4",
        }
      );

    onConfirm(file);

  } catch (error) {

  }
}

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,0.96)",
        zIndex: 99999,

        display: "flex",
flexDirection: "column",

alignItems: "center",

gap: 20,

overflowY: "auto",
padding: 20,
boxSizing: "border-box",
      }}
    >

      <div
        style={{
          color: "#fff",
          fontSize: 20,
          fontWeight: "bold",
        }}
      >
        Editor de vídeo
      </div>

      <video
  ref={videoRef}
  controls
  src={videoUrl}

  onLoadedMetadata={(e) => {

    setDuration(
      e.currentTarget.duration
    );
  }}

  style={{
  width: "100%",
  maxWidth: 900,
  maxHeight: "60vh",

  borderRadius: 16,
  background: "#000",
}}
/>

      <div
        style={{
          width: "100%",
maxWidth: 900,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          color: "#fff",
        }}
      >

        <div>
          Início:
          {" "}
          {startTime.toFixed(1)}s
        </div>

        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={startTime}

          onChange={(e) => {

  const value =
    Number(e.target.value);
if (value >= endTime)
  return;
  setStartTime(value);

  if (videoRef.current) {

  videoRef.current.currentTime =
    value;
}
}}
        />

        <div>
          Fim:
          {" "}
          {endTime.toFixed(1)}s
        </div>

        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={endTime}

          onChange={(e) => {

  const value =
    Number(e.target.value);
if (value <= startTime)
  return;
  setEndTime(value);

  if (videoRef.current) {

  videoRef.current.currentTime =
    value;
}

}}
        />
      </div>

      <div
  style={{
    display: "flex",
    gap: 12,
    paddingBottom: 20,
  }}
>
        <button
          onClick={onClose}
        >
          Cancelar
        </button>

        <button
          onClick={
            handleConfirm
          }
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}