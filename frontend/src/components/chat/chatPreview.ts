export function getReplyPreview(message: {
  messageType?: string;
  content?: string | null;
  fileName?: string | null;
}) {
  switch (message.messageType ?? "TEXT") {
    case "TEXT":
      return message.content;

    case "IMAGE":
      return "📷 Imagem";

    case "VIDEO":
      return "🎥 Vídeo";

    case "AUDIO":
      return "🎤 Áudio";

    case "DOCUMENT":
      return `📄 ${message.fileName ?? "Documento"}`;

    case "LOCATION":
      return "📍 Localização";

    default:
      return message.content ?? "Mensagem";
  }
}