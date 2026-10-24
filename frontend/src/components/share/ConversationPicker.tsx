import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { getImageUrl } from "../../utils/image";
import styles from "./ConversationPicker.module.css";

export type Conversation = {
  id: string;
  name: string;
  avatar?: string;
  preview?: string;
};

type Props = {
  onSelect(conversationId: string): void;
};

export default function ConversationPicker({
  onSelect,
}: Props) {
  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    async function load() {
      const res = await api.get(
        "/chat/share-conversations"
      );

      const list = res.data.map(
        (c: any) => ({
          id: c.id,

          name: c.name,

          avatar: getImageUrl(
            c.avatarUrl
          ),

          preview: c.preview,
        })
      );

      setConversations(list);
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    return conversations.filter((c) =>
      c.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [conversations, search]);

 return (

    <div className={styles.container}>

        <div className={styles.searchContainer}>

            <input
                className={styles.search}
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) =>
                    setSearch(
                        e.target.value
                    )
                }
            />

        </div>

        <div className={styles.list}>

            {filtered.map((c) => (

                <div
                    key={c.id}
                    className={styles.item}
                    onClick={() =>
                        onSelect(c.id)
                    }
                >

                    <img
                        src={c.avatar}
                        className={styles.avatar}
                    />

                    <div className={styles.info}>

                        <strong className={styles.name}>
                            {c.name}
                        </strong>

                        <span className={styles.preview}>
                            {c.preview}
                        </span>

                    </div>

                </div>

            ))}

        </div>

    </div>

);
}