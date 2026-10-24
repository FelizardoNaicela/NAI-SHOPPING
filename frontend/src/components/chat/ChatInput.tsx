import type { Message } from "./types";

import { ChatAttachmentPreview } from "./ChatAttachmentPreview";
import { ChatUploadMenu } from "./ChatUploadMenu";
import { ChatComposer } from "./ChatComposer";


type Props = {
  previewUrl: string | null;
  selectedFile: File | null;
  sendingImage: boolean;
  uploadProgress: number;
  replyingTo: Message | null;

  content: string;

  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;

  setPreviewUrl: (
    value: string | null
  ) => void;

  setSelectedFile: (
    file: File | null
  ) => void;

  setReplyingTo: (
    msg: Message | null
  ) => void;

  handleImageSelect: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;

  handleTypingInput: (
    value: string
  ) => void;

  handleKeyDown: (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;

  sendImage: () => void;
  sendMessage: () => void;

  editingMessageId: string | null;

editingContent: string;

setEditingContent: (
  value: string
) => void;

saveEdit: () => void;

cancelEdit: () => void;

audioInputRef:
React.RefObject<HTMLInputElement | null>;

handleAudioSelect: (
  e: React.ChangeEvent<HTMLInputElement>
) => void;

recording: boolean;

startRecording: () => void;

stopRecording: () => void;

recordingTime: number;

formatRecordingTime: (
  seconds: number
) => string;

videoInputRef:
React.RefObject<HTMLInputElement | null>;

documentInputRef:
React.RefObject<HTMLInputElement | null>;

uploadVideo: (
  file: File
) => void;

uploadDocument: (
  file: File
) => void;

sendLocation: () => void;

openCamera: () => void;

videoPreviewUrl: string | null;

setVideoPreviewUrl: (
  value: string | null
) => void;

handleVideoSelect: (
  e: React.ChangeEvent<HTMLInputElement>
) => void;

  cancelRecording: () => void;
};

export function ChatInput({
  previewUrl,
  sendingImage,
  uploadProgress,
  replyingTo,
  content,
  textareaRef,
  fileInputRef,
  setPreviewUrl,
  setSelectedFile,
  setReplyingTo,
  handleImageSelect,
  handleTypingInput,
  handleKeyDown,
  sendImage,
  sendMessage,
  editingMessageId,
editingContent,
setEditingContent,
saveEdit,
cancelEdit,
audioInputRef,
handleAudioSelect,

recording,
startRecording,
stopRecording,
cancelRecording,

recordingTime,

videoInputRef,
documentInputRef,

uploadVideo,
uploadDocument,
sendLocation,
openCamera,
videoPreviewUrl,
setVideoPreviewUrl,
selectedFile,
handleVideoSelect,
}: Props) {


  return (
    <>
    {editingMessageId && (
  <div
    style={{
      padding: 10,
      borderTop:"1px solid var(--border)",
      background:"rgba(249,115,22,.10)",
borderBottom:"1px solid var(--border)",
    }}
  >
    <div
      style={{
        fontSize: 12,
        marginBottom: 8,
        color:"var(--text-soft)",
      }}
    >
      Editando mensagem
    </div>

    <textarea
      value={editingContent}
      onChange={(e) =>
        setEditingContent(
          e.target.value
        )
      }
      rows={3}
      style={{
        width: "90%",
        padding: 10,
        borderRadius: 8,
        border:"1px solid var(--border)",
        resize: "none",
        background:"var(--surface)",
color:"var(--text)"
      }}
    />

    <div
      style={{
        display: "flex",
        gap: 10,
        marginTop: 10,
      }}
    >
      <button
        onClick={saveEdit}
      >
        Salvar
      </button>

      <button
        onClick={cancelEdit}
      >
        Cancelar
      </button>
    </div>
  </div>
)}
<ChatAttachmentPreview
  previewUrl={previewUrl}
  videoPreviewUrl={videoPreviewUrl}
  selectedFile={selectedFile}
  sendingImage={sendingImage}
  uploadProgress={uploadProgress}
  setPreviewUrl={setPreviewUrl}
  setVideoPreviewUrl={setVideoPreviewUrl}
  setSelectedFile={setSelectedFile}
  sendImage={sendImage}
  uploadVideo={uploadVideo}
/>

      <div
  style={{
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    padding: "8px 10px",
    background: "transparent",
    borderTop: "none",
  }}
>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageSelect}
        />

        <input
  type="file"
  accept="video/*"
  style={{ display: "none" }}
  ref={videoInputRef}
  onChange={handleVideoSelect}
/>

<input
  type="file"
  style={{ display: "none" }}
  ref={documentInputRef}
  onChange={(e) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    uploadDocument(file);
  }}
/>

        {!recording && (
  <div
    style={{
      position: "relative",
    }}
  >
    <ChatUploadMenu
  recording={recording}
  fileInputRef={fileInputRef}
  audioInputRef={audioInputRef}
  videoInputRef={videoInputRef}
  documentInputRef={documentInputRef}
  openCamera={openCamera}
  sendLocation={sendLocation}
/>
  </div>
)}

        <input
  type="file"
  accept="audio/*"
  style={{ display: "none" }}
  ref={audioInputRef}
  onChange={handleAudioSelect}
/>

<ChatComposer
  replyingTo={replyingTo}
  setReplyingTo={setReplyingTo}
  content={content}
  recording={recording}
  textareaRef={textareaRef}
  handleTypingInput={handleTypingInput}
  handleKeyDown={handleKeyDown}
  sendMessage={sendMessage}
  startRecording={startRecording}
  stopRecording={stopRecording}
  recordingTime={recordingTime}
  cancelRecording={cancelRecording}
/>
      </div>
    </>
  );
}