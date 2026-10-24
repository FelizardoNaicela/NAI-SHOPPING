import { useState, useRef } from "react";
import { api } from "../../services/api";
import { getSocket } from "../../socket/socket";
import type { Message } from "../../components/chat/types";

type Props = {
    conversationId?: string;

    replyingTo: Message | null;

    setReplyingTo: React.Dispatch<
        React.SetStateAction<Message | null>
    >;
};

export function useChatUploads({
  conversationId,
  replyingTo,
  setReplyingTo,
}: Props) {

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [sendingImage, setSendingImage] =
    useState(false);

    const videoInputRef =
  useRef<HTMLInputElement | null>(null);

const documentInputRef =
  useRef<HTMLInputElement | null>(null);

  async function sendImage() {
    if (
      !selectedFile ||
      !conversationId
    )
      return;

    try {
      setSendingImage(true);

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const res = await api.post(
        "/chat/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },

          onUploadProgress(
            progressEvent
          ) {
            const total =
              progressEvent.total || 1;

            const percent =
              Math.round(
                (progressEvent.loaded *
                  100) /
                  total
              );

            setUploadProgress(
              percent
            );
          },
        }
      );

      getSocket()?.emit(
        "chat:image",
        {
          conversationId,
          imageUrl: res.data.url,
        }
      );

      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);

    } catch (err) {

    } finally {
      setSendingImage(false);
    }
  }

  function handleImageSelect(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);

    const url =
      URL.createObjectURL(file);

    setPreviewUrl(url);
  }

  async function uploadAudio(
    file: File
  ) {
    if (!conversationId)
      return;

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const res = await api.post(
        "/chat/upload-audio",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      getSocket()?.emit(
  "chat:audio",
  {
    conversationId,
    audioUrl: res.data.url,
    replyToId: replyingTo?.id,
  }
);

setReplyingTo(null);
    } catch (err) {

    }
  }

  async function uploadVideo(
  file: File
) {

  if (!conversationId)
    return;

  try {



   const formData = new FormData();

formData.append("file", file);

const thumbnail =
  await generateVideoThumbnail(file);

if (thumbnail) {
  formData.append(
    "thumbnail",
    thumbnail,
    "thumbnail.jpg"
  );
}

    // TEMPORARIAMENTE
    // sem thumbnail

    const res =
      await api.post(
        "/chat/upload-video",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    getSocket()?.emit(
  "chat:video",
  {
    conversationId,
    videoUrl: res.data.url,
    thumbnailUrl: res.data.thumbnailUrl,
    replyToId: replyingTo?.id,
  }
);

setReplyingTo(null);

  } catch (err) {

  }
}

async function uploadDocument(file: File) {
  if (!conversationId) return;

  const formData = new FormData();

  formData.append("file", file);

  const res = await api.post(
    "/chat/upload-document",
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  getSocket()?.emit(
    "chat:document",
    {
      conversationId,

      documentUrl: res.data.url,

      documentName: res.data.name,

      documentSize: res.data.size,
      replyToId: replyingTo?.id
    }
  );
  setReplyingTo(null);

}

async function sendLocation() {
  if (!conversationId) return;

  navigator.geolocation.getCurrentPosition(
    async (position) => {

      getSocket()?.emit(
        "chat:location",
        {
          conversationId,

          latitude:
            position.coords.latitude,

          longitude:
            position.coords.longitude,

                  replyToId: replyingTo?.id
        }
      );
      setReplyingTo(null);
    }
  );
}

  async function handleAudioSelect(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) return;

    uploadAudio(file);
  }

  async function generateVideoThumbnail(
  file: File
): Promise<Blob | null> {

  return new Promise(
    (resolve) => {

      const video =
        document.createElement(
          "video"
        );

      video.src =
        URL.createObjectURL(file);

      video.currentTime = 1;

      video.onloadeddata =
        () => {

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            video.videoWidth;

          canvas.height =
            video.videoHeight;

          const ctx =
            canvas.getContext("2d");

          if (!ctx) {
            resolve(null);
            return;
          }

          ctx.drawImage(
            video,
            0,
            0
          );

          canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            "image/jpeg",
            0.7
          );
        };
    }
  );
}

 return {
  selectedFile,
  setSelectedFile,

  previewUrl,
  setPreviewUrl,

  uploadProgress,
  sendingImage,

  sendImage,
  handleImageSelect,

  uploadAudio,
  handleAudioSelect,

  // NOVOS
  uploadVideo,
  uploadDocument,
  sendLocation,

  videoInputRef,
  documentInputRef,
};
}