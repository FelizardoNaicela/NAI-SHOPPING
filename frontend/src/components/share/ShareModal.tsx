import ConversationPicker from "./ConversationPicker";
import { getSocket } from "../../socket/socket";
import ExternalSharePanel from "./ExternalSharePanel";
import { Globe } from "lucide-react";
import styles from "./ShareModal.module.css";
import { createPortal } from "react-dom";

type Props = {
    open: boolean;

    type: "message" | "product" | "post";

    id: string | null;

    shareUrl: string;

    onClose(): void;
};
import { useEffect, useState } from "react";

export default function ShareModal({
    open,
    type,
    id,
    shareUrl,
    onClose,
}: Props) {

    const [screen, setScreen] = useState<
    "inside" | "outside"
>("inside");

useEffect(() => {

    if (open) {
        setScreen("inside");
    }

}, [open]);

    if (!open) return null;

    function shareInside(
        conversationId: string,
    ) {

        if (!id) return;

        const socket = getSocket();

        if (type === "message") {

            socket?.emit(
                "chat:share-message",
                {
                    conversationId,
                    sharedMessageId: id,
                }
            );

        } else {

            socket?.emit(
                "chat:share-link",
                {

                    conversationId,

                    sharedProductId:
                        type === "product"
                            ? id
                            : undefined,

                    sharedPostId:
                        type === "post"
                            ? id
                            : undefined,
                }
            );

        }

        onClose();
    }

    if (!open) return null;

return createPortal(

       <div
    className={styles.overlay}
    onClick={onClose}
>

    <div
    className={styles.modal}
    onClick={(e)=>e.stopPropagation()}
>

                <div className={styles.header}>

    Compartilhar

</div>

              <div className={styles.body}>
{
screen === "inside" ? (

<>

    <div className={styles.section}>

    <button
        className={styles.primaryButton}
        onClick={() =>
            setScreen("outside")
        }
    >

        <Globe size={18}/>

        Compartilhar fora

    </button>

</div>

    <ConversationPicker
        onSelect={shareInside}
    />

</>

) : (

<>

    <ExternalSharePanel
        url={shareUrl}
    />

   <div className={styles.footer}>

    <button
        className={styles.secondaryButton}
        onClick={() =>
            setScreen("inside")
        }
    >

        ← Voltar

    </button>

</div>

</>

)
}
</div>

                {
screen==="inside" && (

<div className={styles.footer}>

    <button
        className={styles.secondaryButton}
        onClick={onClose}
    >

        Cancelar

    </button>

</div>

)
}

            </div>

        </div>,

    document.body

);
}