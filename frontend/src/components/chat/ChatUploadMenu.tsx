import React, { useEffect, useRef, useState } from "react";
import {
    Plus,
    Camera,
    Image,
    Video,
    FileText,
    MapPin,
    Mic,
} from "lucide-react";

type Props = {
  recording: boolean;

  fileInputRef: React.RefObject<HTMLInputElement | null>;
  audioInputRef: React.RefObject<HTMLInputElement | null>;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  documentInputRef: React.RefObject<HTMLInputElement | null>;

  openCamera: () => void;
  sendLocation: () => void;
};

export function ChatUploadMenu({
  recording,

  fileInputRef,
  audioInputRef,
  videoInputRef,
  documentInputRef,

  openCamera,
  sendLocation,
}: Props) {
  const [showUploadMenu, setShowUploadMenu] =
    useState(false);

  const uploadMenuRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(
      e: MouseEvent
    ) {
      if (
        uploadMenuRef.current &&
        !uploadMenuRef.current.contains(
          e.target as Node
        )
      ) {
        setShowUploadMenu(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,

  width: "100%",

  padding: "12px 14px",

  borderRadius: 12,

  border: "none",

  background: "transparent",

  color: "var(--text)",

  cursor: "pointer",

  fontSize: 14,
  fontWeight: 500,

  transition: "all .18s ease",

  textAlign: "left" as const,
};

  if (recording) return null;

  return (
    <div
      ref={uploadMenuRef}
      style={{
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={() =>
          setShowUploadMenu(
            (prev) => !prev
          )
        }
        style={{
  width:40,
  height: 40,
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--primary)",
  cursor: "pointer",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  transition: "all .2s ease",

  boxShadow: "var(--shadow-sm)",
}}
      >
        <Plus size={22} strokeWidth={2.4} />
      </button>

      {showUploadMenu && (
        <div
          style={{
  position: "absolute",
  bottom: 54,
  left: 0,

  minWidth: 220,

  display: "flex",
  flexDirection: "column",
  gap: 6,

  padding: 8,

  borderRadius: 18,

  background: "var(--surface-glass)",

  backdropFilter: "blur(18px)",

  border: "1px solid var(--border)",

  boxShadow: "var(--shadow-lg)",

  zIndex: 999,
}}
        >
          <button
            type="button"
            onClick={() => {
              openCamera();
              setShowUploadMenu(false);
            }}
            style={menuItemStyle}
          >
            <Camera size={18} color="var(--primary)"/>
Abrir câmera
          </button>

          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
              setShowUploadMenu(false);
            }}
            style={menuItemStyle}
          >
           <Image size={18} color="var(--primary)"/>
Enviar imagem
          </button>

          <button
            type="button"
            onClick={() => {
              audioInputRef.current?.click();
              setShowUploadMenu(false);
            }}
            style={menuItemStyle}
          >
            <Mic size={18} color="var(--primary)"/>
Enviar áudio
          </button>

          <button
            type="button"
            onClick={() => {
              videoInputRef.current?.click();
              setShowUploadMenu(false);
            }}
            style={menuItemStyle}
          >
            <Video size={18} color="var(--primary)"/>
Enviar vídeo
          </button>

          <button
            type="button"
            onClick={() => {
              documentInputRef.current?.click();
              setShowUploadMenu(false);
            }}
            style={menuItemStyle}
          >
            <FileText size={18} color="var(--primary)"/>
Enviar documento
          </button>

          <button
            type="button"
            onClick={() => {
              sendLocation();
              setShowUploadMenu(false);
            }}
            style={menuItemStyle}
          >
            <MapPin size={18} color="var(--primary)"/>
Enviar localização
          </button>
        </div>
      )}
    </div>
  );
}