import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Line,
  Rect,
  Transformer,
} from "react-konva";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import EmojiPicker
from "emoji-picker-react";

type Props = {
  imageUrl: string;

  onClose: () => void;

  onConfirm: (
    file: File
  ) => void;
};

type DrawLine = {
  points: number[];

  color: string;

  size: number;
};

type TextItem = {
  x: number;
  y: number;
  text: string;
};


type StickerItem = {
  x: number;
  y: number;
  emoji: string;
};

type HistoryState = {
  lines: DrawLine[];
  texts: TextItem[];
  stickers: StickerItem[];
};

export function ImageEditorModal({
  imageUrl,
  onClose,
  onConfirm,
}: Props) {

  const stageRef =
    useRef<any>(null);

  const [
    image,
    setImage,
  ] = useState<HTMLImageElement | null>(
    null
  );

  const [
    drawing,
    setDrawing,
  ] = useState(false);

  const [
    lines,
    setLines,
  ] = useState<DrawLine[]>([]);

  const [
    texts,
    setTexts,
  ] = useState<TextItem[]>([]);

  const [
  mode,
  setMode,
] = useState<
  "draw" |
  "text" |
  "sticker" |
  "crop"
>("draw");

  const [
  brushColor,
  setBrushColor,
] = useState("#ff0000");

const [
  brushSize,
  setBrushSize,
] = useState(4);

const [
  history,
  setHistory,
] = useState<
  HistoryState[]
>([]);

const [
  stickers,
  setStickers,
] = useState<
  StickerItem[]
>([]);

const [
  cropMode,
  setCropMode,
] = useState(false);

const [
  cropRect,
  setCropRect,
] = useState({
  x: 100,
  y: 100,
  width: 300,
  height: 300,
});

const cropRef =
  useRef<any>(null);

const trRef =
  useRef<any>(null);

  const [
  redoHistory,
  setRedoHistory,
] = useState<
  {
    lines: DrawLine[];
    texts: TextItem[];
    stickers: StickerItem[];
  }[]
>([]);

const [
  showEmojiPicker,
  setShowEmojiPicker,
] = useState(false);



  useEffect(() => {

    const img =
      new window.Image();

    img.src = imageUrl;

    img.onload = () => {
      setImage(img);
    };

  }, [imageUrl]);

  function handleMouseDown() {

    if (mode !== "draw")
      return;

    saveHistory();
    setDrawing(true);

    const pos =
      stageRef.current.getPointerPosition();

    setLines([
      ...lines,
      {
  points: [
    pos.x,
    pos.y,
  ],

  color: brushColor,

  size: brushSize,
}
    ]);
  }


  useEffect(() => {

  if (
    cropMode &&
    trRef.current &&
    cropRef.current
  ) {
    trRef.current.nodes([
      cropRef.current,
    ]);

    trRef.current.getLayer()?.batchDraw();
  }

}, [cropMode]);



function saveHistory() {

  setHistory((prev) => [
    ...prev,
    {
      lines,
      texts,
      stickers,
    },
  ]);

  setRedoHistory([]);
}


  function handleMouseMove() {

    if (
      !drawing ||
      mode !== "draw"
    )
      return;

    const stage =
      stageRef.current;

    const point =
      stage.getPointerPosition();

    const lastLine =
      lines[
        lines.length - 1
      ];

    lastLine.points = [
      ...lastLine.points,
      point.x,
      point.y,
    ];

    lines.splice(
      lines.length - 1,
      1,
      lastLine
    );

    setLines([
      ...lines,
    ]);
  }

  function handleMouseUp() {
    setDrawing(false);
  }

  function handleStageClick() {

    if (mode !== "text")
      return;

    const text =
      prompt("Texto");

    if (!text) return;

    const pos =
      stageRef.current.getPointerPosition();
saveHistory();
    setTexts([
      ...texts,
      {
        x: pos.x,
        y: pos.y,
        text,
      },
    ]);
  }

  async function handleConfirm() {

  const stage =
    stageRef.current;

  if (
    cropMode
  ) {

    const dataURL =
      stage.toDataURL({
        x: cropRect.x,
        y: cropRect.y,

        width:
          cropRect.width,

        height:
          cropRect.height,
      });

    const response =
      await fetch(dataURL);

    const blob =
      await response.blob();

    const file =
      new File(
        [blob],
        "cropped-image.png",
        {
          type: "image/png",
        }
      );

    onConfirm(file);

    return;
  }

  const uri =
    stage.toDataURL();

  const response =
    await fetch(uri);

  const blob =
    await response.blob();

  const file =
    new File(
      [blob],
      "edited-image.png",
      {
        type: "image/png",
      }
    );

  onConfirm(file);
}
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,0.95)",

        zIndex: 9999,

        display: "flex",

        flexDirection: "column",

        alignItems: "center",

        justifyContent: "center",

        gap: 20,
      }}
    >

      <div
  style={{
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  }}
>
    {/* tools */}
  <button
    onClick={() =>
      setMode("draw")
    }
  >
    ✏ Desenhar
  </button>

  <button
    onClick={() =>
      setMode("text")
    }
  >
    T Texto
  </button>

  <button
    onClick={() => {

        saveHistory();

setLines([]);
setTexts([]);
setStickers([]);

    }}
  >
    🗑 Limpar
  </button>

  <button
  onClick={() => {

    const previous =
      history[
        history.length - 1
      ];

    if (!previous)
      return;

    setRedoHistory(
      (prev) => [
        ...prev,
        {
          lines,
          texts,
          stickers,
        },
      ]
    );

    setLines(previous.lines);

    setTexts(previous.texts);

    setStickers(
      previous.stickers
    );

    setHistory(
      history.slice(
        0,
        -1
      )
    );
  }}
>
  ↩ Undo
</button>

<button
  onClick={() => {

    const next =
      redoHistory[
        redoHistory.length - 1
      ];

    if (!next)
      return;

    setHistory(
      (prev) => [
        ...prev,
        {
          lines,
          texts,
          stickers,
        },
      ]
    );

    setLines(next.lines);

    setTexts(next.texts);

    setStickers(
      next.stickers
    );

    setRedoHistory(
      redoHistory.slice(
        0,
        -1
      )
    );
  }}
>
  ↪ Redo
</button>

  <div
  style={{
    position: "relative",
  }}
>
  <button
    type="button"
    onClick={() =>
      setShowEmojiPicker(
        (prev) => !prev
      )
    }
  >
    😀 Emoji
  </button>

  {showEmojiPicker && (
    <div
      style={{
        position: "absolute",
        top: 50,
        left: 0,
        zIndex: 99999,
      }}
    >
      <EmojiPicker
        onEmojiClick={(
          emojiData
        ) => {

          saveHistory();

          setStickers([
            ...stickers,
            {
              x: 400,
              y: 200,
              emoji:
                emojiData.emoji,
            },
          ]);

          setShowEmojiPicker(
            false
          );
        }}
      />
    </div>
  )}
</div>

<button
  onClick={() =>
    setCropMode(
      (prev) => !prev
    )
  }
>
  ✂ Crop
</button>

  <input
    type="color"
    value={brushColor}
    onChange={(e) =>
      setBrushColor(
        e.target.value
      )
    }
  />

  <input
    type="range"
    min={1}
    max={20}
    value={brushSize}
    onChange={(e) =>
      setBrushSize(
        Number(
          e.target.value
        )
      )
    }
  />
</div>

      {/* CANVAS */}

      <Stage
  ref={stageRef}
  width={900}
  height={600}

  onMouseDown={
    handleMouseDown
  }

  onMouseMove={
    handleMouseMove
  }

  onMouseUp={
    handleMouseUp
  }

  onClick={
    handleStageClick
  }

  style={{
    borderRadius: 20,
    overflow: "hidden",
    background: "#111",
    border: "1px solid #333",
  }}
>
        <Layer>

          {image && (
            <KonvaImage
              image={image}
              width={900}
              height={600}
            />
          )}

          {lines.map(
            (
              line,
              i
            ) => (
              <Line
                key={i}
                points={
                  line.points
                }
                stroke={line.color}
strokeWidth={line.size}
                tension={0.5}
                lineCap="round"
              />
            )
          )}

          {texts.map(
            (
              text,
              i
            ) => (
              <Text
                key={i}
                x={text.x}
                y={text.y}
                text={text.text}
                fill="white"
                fontSize={28}
                fontStyle="bold"
                draggable
              />
            )
          )}

          {stickers.map(
  (
    sticker,
    i
  ) => (
    <Text
      key={i}
      x={sticker.x}
      y={sticker.y}
      text={sticker.emoji}
      fontSize={40}
      draggable
    />
  )
)}

{cropMode && (
  <>
    <Rect
      ref={cropRef}

      x={cropRect.x}
      y={cropRect.y}

      width={
        cropRect.width
      }

      height={
        cropRect.height
      }

      stroke="white"

      dash={[6, 6]}

      draggable

      onDragEnd={(e) => {

        setCropRect({
          ...cropRect,

          x:
            e.target.x(),

          y:
            e.target.y(),
        });
      }}

      onTransformEnd={() => {

        const node =
          cropRef.current;

        const scaleX =
          node.scaleX();

        const scaleY =
          node.scaleY();

        node.scaleX(1);

        node.scaleY(1);

        setCropRect({
          x: node.x(),
          y: node.y(),

          width:
            Math.max(
              50,
              node.width() *
                scaleX
            ),

          height:
            Math.max(
              50,
              node.height() *
                scaleY
            ),
        });
      }}
    />

    <Transformer
      ref={trRef}

      rotateEnabled={
        false
      }
    />
  </>
)}
        </Layer>
      </Stage>

      {/* ACTIONS */}

      <div
        style={{
          display: "flex",
          gap: 12,
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