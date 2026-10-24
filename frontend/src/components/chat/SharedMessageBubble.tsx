import type { Message } from "./types";
import { MessageContent } from "./MessageContent";
import { SharedLinkBubble } from "./SharedLinkBubble";
import { Share2 } from "lucide-react";

type Props = {
  message?: Message | null;
};

export function SharedMessageBubble({
  message,
}: Props) {

  if (!message) {
    return (
      <div
        style={{
          padding: 10,
          borderRadius: 8,
          background:"var(--surface-soft)",
color:"var(--text-soft)",
border:"1px solid var(--border)",
        }}
      >
        Mensagem indisponível
      </div>
    );
  }

  return (
    <div
      style={{
        borderLeft:"4px solid var(--primary)",
background:"var(--surface-soft)",
border:"1px solid var(--border)",
boxShadow:"var(--shadow-sm)",
transition:"all .25s ease",
        borderRadius: 10,
        padding: 10,
      }}
    >

      <div
    style={{
        display:"flex",
        alignItems:"center",
        gap:6,
        fontSize:12,
        color:"var(--primary)",
        fontWeight:600,
        marginBottom:8,
    }}
>
    <Share2 size={14}/>
    Mensagem compartilhada
</div>

      {message.sharedProduct || message.sharedPost ? (

    <SharedLinkBubble
        product={message.sharedProduct}
        post={message.sharedPost}
    />

) : (

    <MessageContent
    message={message}
    onImageClick={(url) =>
        window.open(url, "_blank")
    }
    onVideoClick={(url) =>
        window.open(url, "_blank")
    }
/>

)}

    </div>
  );

}