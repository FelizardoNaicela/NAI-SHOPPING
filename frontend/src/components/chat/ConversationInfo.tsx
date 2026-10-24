import { useState } from "react";
import { getImageUrl } from "../../utils/image";
import type { ConversationInfoData } from "../../hooks/chat/useConversationInfo";
import { ConversationMediaViewer } from "./ConversationMediaViewer";
import Avatar from "../common/Avatar";

type Props = {
    open: boolean;
    onClose(): void;

    loading: boolean;
    info: ConversationInfoData | null;
};

export function ConversationInfo({
    open,
    onClose,
    loading,
    info,
}: Props) {

    const [fullscreen, setFullscreen] =
        useState(false);


    const participant =
        info?.participant;

    const media =
        info?.media;

    const statistics =
        info?.statistics;

        const [section, setSection] = useState<
  | null
  | "gallery"
  | "audios"
  | "documents"
  | "locations"
  | "links"
>(null);
if (!open) return null;

const styles = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,.45)",
    backdropFilter: "blur(6px)",
    zIndex: 1000,
  },

  panel: {
    position: "fixed" as const,
    top: 0,
    right: 0,
    width: 390,
    maxWidth: "100%",
    height: "100%",
    overflowY: "auto" as const,

    background: "var(--surface-glass)",
    color: "var(--text)",

    borderLeft: "1px solid var(--border)",

    boxShadow: "-18px 0 40px rgba(0,0,0,.35)",

    zIndex: 1001,
  },

  header: {
    position: "sticky" as const,
    top: 0,

    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

    padding: "18px 20px",

    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",

    zIndex: 10,
  },

  closeButton: {
    width: 38,
    height: 38,

    borderRadius: "50%",

    border: "none",

    background: "var(--surface-glass)",

    color: "var(--text)",

    cursor: "pointer",

    fontSize: 20,

    transition: ".25s",
  },

  profile: {
    padding: 30,
    textAlign: "center" as const,
  },

  section: {
    margin: 18,

    padding: 20,

    background: "var(--surface-2)",

    borderRadius: 18,

    border: "1px solid var(--border)",

    boxShadow: "0 8px 20px rgba(0,0,0,.08)",
  },

  button: {
    width: "100%",

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    padding: "14px 16px",

    marginTop: 10,

    borderRadius: 12,

    border: "none",

    background: "var(--surface)",

    color: "var(--text)",

    cursor: "pointer",

    transition: ".2s",
  },

  loading: {
    padding: 40,
    textAlign: "center" as const,
    color: "var(--text-soft)",
  },
};

    return (
        <>
            <div
    onClick={onClose}
    style={styles.overlay}
/>

<aside
    style={styles.panel}
>

                <div style={styles.header}>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 20,
                        }}
                    >
                        Informações
                    </h2>

                   <button
    onClick={onClose}
    style={styles.closeButton}
>
    ✕
</button>
                </div>

                {loading && (

                    <div style={styles.loading}>
                        Carregando...
                    </div>

                )}

                {!loading && participant && (

                    <>

                        <div style={styles.profile}>

                            <Avatar
    src={participant.avatarUrl}
    name={participant.name}
    size={140}
    onClick={() => setFullscreen(true)}
/>

                            <h2
                                style={{
                                    marginBottom: 5,
                                }}
                            >
                                {participant.name}
                            </h2>

                            {participant.username && (

                                <div
                                    style={{
                                        color: "#666",
                                    }}
                                >
                                    @{participant.username}
                                </div>

                            )}

                            {participant.bio && (

                                <p
                                    style={{
                                        marginTop: 18,
                                        color: "#555",
                                    }}
                                >
                                    {participant.bio}
                                </p>

                            )}

                        </div>

                        <section style={styles.section}>

                            <h4>Informações</h4>

                            <p>

                                🕒{" "}

                                {participant.lastSeen

                                    ? new Date(
                                          participant.lastSeen
                                      ).toLocaleString()

                                    : "Offline"}

                            </p>

                        </section>

                        <section style={styles.section}>

                            <h4>Estatísticas</h4>

                            <p>

                                💬 Mensagens:{" "}

                                {statistics?.totalMessages ?? 0}

                            </p>

                            <p>

                                📅 Primeira mensagem:

                            </p>

                            <small>

                                {statistics?.firstMessageAt

                                    ? new Date(
                                          statistics.firstMessageAt
                                      ).toLocaleString()

                                    : "-"}

                            </small>

                            <p
                                style={{
                                    marginTop: 15,
                                }}
                            >

                                🕓 Última mensagem

                            </p>

                            <small>

                                {statistics?.lastMessageAt

                                    ? new Date(
                                          statistics.lastMessageAt
                                      ).toLocaleString()

                                    : "-"}

                            </small>

                        </section>

                        <section style={styles.section}>

                            <h4>Mídia</h4>

                            <div
                                style={{
                                    display: "grid",
                                    gap: 12,
                                }}
                            >

                               <button
    style={styles.button}
    onClick={() => setSection("gallery")}
>
    🖼️ Mídia ({media?.gallery.length ?? 0})
</button>

<button
 style={styles.button}
onClick={() => setSection("audios")}>
    🎤 Áudios ({media?.audios.length ?? 0})
</button>

<button
 style={styles.button}
onClick={() => setSection("documents")}>
    📄 Documentos ({media?.documents.length ?? 0})
</button>

<button
 style={styles.button}
onClick={() => setSection("locations")}>
    📍 Localizações ({media?.locations.length ?? 0})
</button>

<button
 style={styles.button}
onClick={() => setSection("links")}>
    🔗 Links ({media?.links.length ?? 0})
</button>
                            </div>

                        </section>

                    </>

                )}

            </aside>

            <ConversationMediaViewer
    section={section}
    media={media}
    onClose={() => setSection(null)}
/>

            {fullscreen && participant && (

                <div
                    onClick={() =>
                        setFullscreen(false)
                    }
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.95)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 2000,
                        cursor: "zoom-out",
                    }}
                >

                    <img
                        src={getImageUrl(
                            participant.avatarUrl
                        )}
                        style={{
                            maxWidth: "92%",
                            maxHeight: "92%",
                            objectFit: "contain",
                        }}
                    />

                </div>

            )}

        </>
    );

}