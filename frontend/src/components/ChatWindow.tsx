import type { Message } from "./chat/types";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatMessages } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";
import { MessageContextMenu } from "./chat/MessageContextMenu";
import { useAudioRecorder }
from "../hooks/chat/useAudioRecorder";
import { useChatMessages }
from "../hooks/chat/useChatMessages";
import { useChatSocket }
from "../hooks/chat/useChatSocket";
import { useChatUploads }
from "../hooks/chat/useChatUploads";
import { useChatDrafts }
from "../hooks/chat/useChatDrafts";
import { useChatTyping }
from "../hooks/chat/useChatTyping";
import { useChatPresence }
from "../hooks/chat/useChatPresence";
import { useChatMenu }
from "../hooks/chat/useChatMenu";
import { useChatHistory }
from "../hooks/chat/useChatHistory";
import { useChatEditor }
from "../hooks/chat/useChatEditor";
import { useChatActions }
from "../hooks/chat/useChatActions";
import { useChatConversationState }
from "../hooks/chat/useChatConversationState";
import { useChatRead }
from "../hooks/chat/useChatRead";
import { useChatTime }
from "../hooks/chat/useChatTime";
import "../styles/chat.css";
import { CameraModal }
from "./chat/CameraModal";
import { ImageEditorModal }
from "./chat/editors/ImageEditorModal";
import { VideoEditorModal }
from "./chat/editors/VideoEditorModal";
import { ConversationInfo } from "./chat/ConversationInfo";
import { useConversationInfo }
from "../hooks/chat/useConversationInfo";
import { FullscreenImage } from "./common/ZoomableImage/FullscreenImage";
import { ShareMessageModal } from "./chat/ShareMessageModal";
import FullscreenVideo from "./chat/FullscreenVideo";

import { useState, useRef, useEffect } from "react";
import { getSocket } from "../socket/socket";

type Props = {
  conversationId?: string;
  userId: string;
  conversationName?: string;
  avatarUrl?: string;
  targetUserId?: string;
  lastSeen?: string;
};

export function ChatWindow({
  conversationId,
  userId,
  conversationName,
  avatarUrl,
  targetUserId,
  lastSeen,
}: Props) {

const {
  messages,
  setMessages,

  cursor,
  setCursor,

  hasMore,
  setHasMore,

  loadingMore,
  setLoadingMore,

  loadingMessages,
  setLoadingMessages,
} = useChatMessages({
  conversationId,
});


const messagesContainerRef =
  useRef<HTMLDivElement | null>(null);

  const [content, setContent] = useState("");

  const [isTyping, setIsTyping] = useState(false);
const [selectedImage, setSelectedImage] =
  useState<string | null>(null);

  const fileInputRef =
  useRef<HTMLInputElement | null>(null);

  const [replyingTo, setReplyingTo] =
  useState<Message | null>(null);

  const textareaRef =
  useRef<HTMLTextAreaElement | null>(null);

  const [showInfo, setShowInfo] =
    useState(false);

    const [selectedVideo, setSelectedVideo] = useState<{
    src: string;
    poster?: string | null;
} | null>(null);

useChatSocket({
  conversationId,
  userId,
  setMessages,
  setIsTyping,
});

useChatRead({
  conversationId,
  messagesLength: messages.length,
});

const [
  highlightedMessageId,
  setHighlightedMessageId,
] = useState<string | null>(null);

const [
  scrollToMessageId,
  setScrollToMessageId,
] = useState<string | null>(null);

const {
  getDraft,
  saveDraft,
  clearDraft,
} = useChatDrafts();

const {
  isOnline,
} = useChatPresence({
  targetUserId,
});



const {
  contextMenu,
  setContextMenu,
} = useChatMenu();


const {
  loadMoreMessages,
} = useChatHistory({
  conversationId,

  setMessages,

  setCursor,
  setHasMore,

  setLoadingMessages,
  setLoadingMore,

  cursor,
  hasMore,
  loadingMore,

  messagesContainerRef,
});

const [
  shareMessageId,
  setShareMessageId,
] = useState<string | null>(null);


const {
  editingMessageId,
  setEditingMessageId,

  editingContent,
  setEditingContent,

  saveEdit,
  cancelEdit,
} = useChatEditor({
  setMessages,
});

const {
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
} = useChatUploads({
  conversationId,
  replyingTo,
  setReplyingTo,
});

const [
  videoPreviewUrl,
  setVideoPreviewUrl,
] = useState<string | null>(null);

const [
  showImageEditor,
  setShowImageEditor,
] = useState(false);

const [
  showVideoEditor,
  setShowVideoEditor,
] = useState(false);

const [
  editorImageUrl,
  setEditorImageUrl,
] = useState<string | null>(null);


const {
  autoResizeTextarea,
  sendMessage,
  handleKeyDown,
} = useChatActions({
  conversationId,

  content,
  setContent,

  replyingTo,
  setReplyingTo,

  clearDraft,

  textareaRef,

  editingMessageId,
  saveEdit,
});

const {
  handleTypingInput,
} = useChatTyping({
  conversationId,
  setContent,
  autoResizeTextarea,
  saveDraft,
});

const {
  recording,
  recordingTime,
  startRecording,
  stopRecording,
  cancelRecording,
  formatRecordingTime,
} = useAudioRecorder({
  onAudioReady: async (
  file
) => {
  await uploadAudio(file);
},
});

const {
    info,
    loading,
} = useConversationInfo({

    conversationId,

    open: showInfo,

});


useChatConversationState({
  conversationId,

  getDraft,
  setContent,

  setReplyingTo,

  setSelectedFile,
  setPreviewUrl,

  cancelEdit,

  textareaRef,
});

function handleOpenVideoEditor(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const file = e.target.files?.[0];

  if (!file) return;

  setSelectedFile(file);

  setVideoPreviewUrl(
    URL.createObjectURL(file)
  );

  setShowVideoEditor(true);
}

const {
  formatTime,
} = useChatTime();

const [
  cameraOpen,
  setCameraOpen,
] = useState(false);

  const audioInputRef =
  useRef<HTMLInputElement | null>(null);


  function handleOpenImageEditor(
  e: React.ChangeEvent<HTMLInputElement>
) {

  handleImageSelect(e);

  setShowImageEditor(true);
}

useEffect(() => {
  if (!conversationId) return;

  sessionStorage.setItem(
    "activeConversation",
    conversationId
  );

  return () => {
    sessionStorage.removeItem(
      "activeConversation"
    );
  };
}, [conversationId]);

useEffect(() => {
  if (!conversationId) return;

  const socket = getSocket();

  if (!socket) return;

  const pendingProduct =
    localStorage.getItem(
      "pendingSharedProductId"
    );

  const pendingPost =
    localStorage.getItem(
      "pendingSharedPostId"
    );

  if (pendingProduct) {
    socket.emit("chat:share-link", {
      conversationId,
      sharedProductId: pendingProduct,
    });

    localStorage.removeItem(
      "pendingSharedProductId"
    );
  }

  if (pendingPost) {

    socket.emit("chat:share-link", {
      conversationId,
      sharedPostId: pendingPost,
    });

    localStorage.removeItem(
      "pendingSharedPostId"
    );
  }

}, [conversationId]);

  return (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
    }}
  >
    <style>
      {`
        @keyframes pulse {
          0% {
            opacity: 0.5;
          }

          50% {
            opacity: 1;
          }

          100% {
            opacity: 0.5;
          }
        }
      `}
    </style>

      {!conversationId ? (
        <div style={{ padding: 20 }}>
          Selecione uma conversa
        </div>
      ) : (
        <>
          {/* HEADER */}
<ChatHeader
  conversationName={conversationName}
  avatarUrl={avatarUrl}
  isOnline={isOnline}
  isTyping={isTyping}
  lastSeen={lastSeen}
  onBack={() => {
    window.dispatchEvent(
      new CustomEvent("close-chat")
    );
  }}
  onOpenInfo={() => setShowInfo(true)}
/>
          {/* MENSAGENS */}
          <ChatMessages
  messages={messages}
  loadingMessages={
    loadingMessages
  }
  hasMore={hasMore}
  loadingMore={loadingMore}
  loadMoreMessages={
    loadMoreMessages
  }
  userId={userId}
  conversationName={
    conversationName
  }
  setSelectedImage={
    setSelectedImage
  }

  setSelectedVideo={setSelectedVideo}

  setContextMenu={
    setContextMenu
  }
  formatTime={formatTime}

  onReact={(message, emoji) => {
  getSocket()?.emit(
    "chat:react",
    {
      messageId: message.id,
      emoji,
    }
  );
}}

scrollToMessageId={
  scrollToMessageId
}

onReplyClick={(messageId) => {

  setScrollToMessageId(
    messageId
  );

  setHighlightedMessageId(
    messageId
  );

  setTimeout(() => {

    setHighlightedMessageId(
      null
    );

  }, 1800);
}}

onReplyScrollFinished={() => {
  setScrollToMessageId(null);
}}

highlightedMessageId={
    highlightedMessageId
}

onSwipeReply={(message) => {
  setReplyingTo(message);
}}

/>

<FullscreenImage
    src={selectedImage}
    onClose={() => setSelectedImage(null)}
/>

<FullscreenVideo
    video={selectedVideo}
    onClose={() => setSelectedVideo(null)}
/>


<CameraModal
  open={cameraOpen}

  onClose={() =>
    setCameraOpen(false)
  }

  onCapturePhoto={(file) => {

  setEditorImageUrl(
    URL.createObjectURL(file)
  );
}}

 onCaptureVideo={(file) => {

  setSelectedFile(file);

  setVideoPreviewUrl(
    URL.createObjectURL(file)
  );

  setShowVideoEditor(true);

}}
/>


{editorImageUrl && (
  <ImageEditorModal
    imageUrl={editorImageUrl}

    onClose={() => {

      setEditorImageUrl(null);
    }}

    onConfirm={(editedFile) => {

      setSelectedFile(
        editedFile
      );

      setPreviewUrl(
        URL.createObjectURL(
          editedFile
        )
      );

      setEditorImageUrl(null);
    }}
  />
)}
          {/* INPUT */}
          <ChatInput
  previewUrl={previewUrl}
  selectedFile={selectedFile}
  sendingImage={sendingImage}
  uploadProgress={uploadProgress}
  replyingTo={replyingTo}
  content={content}
  textareaRef={textareaRef}
  fileInputRef={fileInputRef}
  setPreviewUrl={setPreviewUrl}
  setSelectedFile={setSelectedFile}
  setReplyingTo={setReplyingTo}
handleImageSelect={handleOpenImageEditor}
  handleTypingInput={handleTypingInput}
  handleKeyDown={handleKeyDown}
  sendImage={sendImage}
  sendMessage={sendMessage}

  editingMessageId={editingMessageId}
  editingContent={editingContent}
  setEditingContent={setEditingContent}
  saveEdit={saveEdit}
  cancelEdit={cancelEdit}

  audioInputRef={audioInputRef}
handleAudioSelect={handleAudioSelect}

recording={recording}
startRecording={startRecording}
stopRecording={stopRecording}
cancelRecording={cancelRecording}

recordingTime={recordingTime}
formatRecordingTime={
  formatRecordingTime
}

videoInputRef={videoInputRef}
documentInputRef={documentInputRef}

uploadVideo={uploadVideo}
uploadDocument={uploadDocument}

sendLocation={sendLocation}

openCamera={() =>
  setCameraOpen(true)
}

videoPreviewUrl={videoPreviewUrl}
setVideoPreviewUrl={
  setVideoPreviewUrl
}

handleVideoSelect={
  handleOpenVideoEditor
}
/>
        </>
      )}


<MessageContextMenu
  contextMenu={contextMenu}
  userId={userId}
  setContextMenu={setContextMenu}
  setReplyingTo={setReplyingTo}
  setEditingMessageId={setEditingMessageId}
  setEditingContent={setEditingContent}
  setMessages={setMessages}
  onShare={(message) =>
    setShareMessageId(message.id)
  }
/>

<ConversationInfo
    open={showInfo}
    onClose={() => setShowInfo(false)}
    loading={loading}
    info={info}
/>

{showImageEditor &&
  previewUrl && (
    <ImageEditorModal
      imageUrl={previewUrl}

      onClose={() => {
        setShowImageEditor(false);
      }}

      onConfirm={(file) => {

        setSelectedFile(file);

        setPreviewUrl(
          URL.createObjectURL(file)
        );

        setShowImageEditor(false);
      }}
    />
)}

{showVideoEditor &&
  videoPreviewUrl && (
    <VideoEditorModal
      videoUrl={
        videoPreviewUrl
      }

      onClose={() =>
        setShowVideoEditor(
          false
        )
      }

      onConfirm={(file) => {

        setSelectedFile(file);

        setVideoPreviewUrl(
          URL.createObjectURL(file)
        );

        setShowVideoEditor(
          false
        );
      }}
    />
)}

<ShareMessageModal
  open={shareMessageId !== null}
  messageId={shareMessageId}
  onClose={() =>
    setShareMessageId(null)
  }
/>
    </div>
  );
}