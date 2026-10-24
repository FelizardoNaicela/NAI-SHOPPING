import {
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  src: string;
};

function format(seconds: number) {
  if (!Number.isFinite(seconds))
    return "0:00";

  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  return `${m}:${s
    .toString()
    .padStart(2, "0")}`;
}

export function ChatAudioPlayer({
  src,
}: Props) {
  const audioRef =
    useRef<HTMLAudioElement>(null);

  const progressRef =
    useRef<HTMLDivElement>(null);

  const [
    playing,
    setPlaying,
  ] = useState(false);

  const [
    current,
    setCurrent,
  ] = useState(0);

  const [
    duration,
    setDuration,
  ] = useState(0);

  const [
  playbackRate,
  setPlaybackRate,
] = useState(1);

  useEffect(() => {
    const audio =
      audioRef.current;

    if (!audio) return;

    const loaded = () =>
      setDuration(audio.duration);

    const update = () =>
      setCurrent(audio.currentTime);

    const play = () =>
      setPlaying(true);

    const pause = () =>
      setPlaying(false);

    const ended = () => {
      setPlaying(false);
      setCurrent(0);
    };

    audio.addEventListener(
      "loadedmetadata",
      loaded
    );

    audio.addEventListener(
      "timeupdate",
      update
    );

    audio.addEventListener(
      "play",
      play
    );

    audio.addEventListener(
      "pause",
      pause
    );

    audio.addEventListener(
      "ended",
      ended
    );

    return () => {
      audio.removeEventListener(
        "loadedmetadata",
        loaded
      );

      audio.removeEventListener(
        "timeupdate",
        update
      );

      audio.removeEventListener(
        "play",
        play
      );

      audio.removeEventListener(
        "pause",
        pause
      );

      audio.removeEventListener(
        "ended",
        ended
      );
    };
  }, []);

  function toggle() {
    const audio =
      audioRef.current;

    if (!audio) return;

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  function changeSpeed() {
  const audio = audioRef.current;

  if (!audio) return;

  const next =
    playbackRate === 1
      ? 1.5
      : playbackRate === 1.5
      ? 2
      : 1;

  audio.playbackRate = next;

  setPlaybackRate(next);
}

  function seek(
    e: React.MouseEvent
  ) {
    const bar =
      progressRef.current;

    const audio =
      audioRef.current;

    if (!bar || !audio)
      return;

    const rect =
      bar.getBoundingClientRect();

    const x =
      e.clientX - rect.left;

    const percent =
      Math.min(
        Math.max(
          x / rect.width,
          0
        ),
        1
      );

    audio.currentTime =
      percent * duration;
  }

  const percent =
    duration > 0
      ? (current / duration) *
        100
      : 0;

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
      />

      <div
       style={{
    width: "100%",
    boxSizing: "border-box",

          padding:
            "10px 12px",

          borderRadius: 999,

          background:"var(--surface)",
border:"1px solid var(--border)",
backdropFilter:"blur(10px)",

          display: "flex",

          alignItems:
            "center",

          gap: 10,

          overflow:
            "hidden",
        }}
      >
        <button
          onClick={toggle}
          style={{
            width: 38,
            height: 38,

            border: "none",

            borderRadius:
              "50%",

            background:
              "#f97316",

            color: "#fff",

            cursor:
              "pointer",

            flexShrink: 0,

            fontSize: 15,

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            boxShadow:
              "0 2px 6px rgba(0,0,0,.15)",
          }}
        >
          {playing
            ? "❚❚"
            : "▶"}
        </button>

        <div
          style={{
            flex: 1,

            minWidth: 0,
          }}
        >
          <div
            ref={progressRef}
            onClick={seek}
            style={{
              height: 6,

              borderRadius: 999,

              background:"var(--border)",

              cursor:
                "pointer",

              position:
                "relative",

              overflow:
                "hidden",
            }}
          >
            <div
              style={{
                width:
                  `${percent}%`,

                height:
                  "100%",

                background:
                  "#f97316",

                borderRadius:
                  999,

                transition:
                  "width .08s linear",
              }}
            />

            <div
              style={{
                position:
                  "absolute",

                left: `calc(${percent}% - 6px)`,

                top: -3,

                width: 12,

                height: 12,

                borderRadius:
                  "50%",

                background:
                  "#f97316",

                boxShadow:"0 0 0 2px var(--surface)",
              }}
            />
          </div>

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              marginTop: 6,

              fontSize: 11,

              color:"var(--text-soft)",
            }}
          >
            <span>
              {format(current)}
            </span>

            <span>
              {format(duration)}
            </span>
          </div>
        </div>

       <div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  }}
>
    <button
  onClick={changeSpeed}
  style={{
    border: "none",
    background: "transparent",
    cursor: "pointer",

    fontSize: 10,

    fontWeight: 700,

    color:"var(--primary)",

    padding: 0,
  }}
>
  {playbackRate}×
</button>
        </div>
      </div>

      <style>
        {`
          @keyframes wave{

            0%{
              transform:scaleY(.5);
            }

            50%{
              transform:scaleY(1.5);
            }

            100%{
              transform:scaleY(.5);
            }

          }
        `}
      </style>
    </>
  );
}