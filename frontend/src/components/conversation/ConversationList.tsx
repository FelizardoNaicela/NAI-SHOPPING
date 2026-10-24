import styles from "./ConversationList.module.css";
import Avatar from "../common/Avatar";

export type ConversationUI = {
    id: string;
    name: string;
    avatar?: string;
    lastMessage?: string;
    unreadCount?: number;
};

type Props = {
    conversations: ConversationUI[];

    activeConversation: ConversationUI | null;

    mode: "user" | "store";

    onModeChange: (
        mode: "user" | "store"
    ) => void;

    onConversationClick: (
        conversation: ConversationUI
    ) => void;
};

export default function ConversationList({

    conversations,

    activeConversation,

    mode,

    onModeChange,

    onConversationClick,

}: Props) {

    return (

        <aside className={styles.sidebar}>

            <div className={styles.modeSwitcher}>

                <button
                    className={
                        mode === "user"
                            ? styles.activeMode
                            : ""
                    }
                    onClick={() =>
                        onModeChange("user")
                    }
                >
                    Pessoal
                </button>

                <button
                    className={
                        mode === "store"
                            ? styles.activeMode
                            : ""
                    }
                    onClick={() =>
                        onModeChange("store")
                    }
                >
                    Loja
                </button>

            </div>

            <div className={styles.list}>

                {conversations.map((conversation) => (

                    <button

                        key={conversation.id}

                        className={`${styles.item}
                        ${
                            activeConversation?.id ===
                            conversation.id
                                ? styles.selected
                                : ""
                        }`}

                        onClick={() =>
                            onConversationClick(
                                conversation
                            )
                        }

                    >

                        <Avatar
    src={conversation.avatar}
    name={conversation.name}
    size={48}
/>

                        <div className={styles.info}>

                            <div className={styles.topRow}>

                                <span
                                    className={
                                        styles.name
                                    }
                                >
                                    {conversation.name}
                                </span>

                                {conversation.unreadCount! >
                                    0 && (

                                    <span
                                        className={
                                            styles.badge
                                        }
                                    >
                                        {
                                            conversation.unreadCount
                                        }
                                    </span>

                                )}

                            </div>

                            <span
                                className={
                                    styles.lastMessage
                                }
                            >
                                {conversation.lastMessage ||
                                    "Sem mensagens"}
                            </span>

                        </div>

                    </button>

                ))}

            </div>

        </aside>

    );

}