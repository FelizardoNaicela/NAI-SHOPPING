import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { api } from "../services/api";
import FeedPost from "../components/FeedPost";

import type { BackendPost } from "../services/feed";
import FloatingDrawers from "../components/drawer/FloatingDrawers";

export default function PostPage() {

    const { postId } = useParams();

    const [post, setPost] =
        useState<BackendPost | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        async function load() {

            try {

                const { data } =
                    await api.get(
                        `/posts/${postId}`
                    );

                setPost(data);

            } finally {

                setLoading(false);

            }

        }

        load();

    }, [postId]);

    if (loading) {
        return (
            <div style={{ padding: 30 }}>
                <FloatingDrawers />
                Carregando...
            </div>
        );
    }

    if (!post) {
        return (
            <div style={{ padding: 30 }}>
                <FloatingDrawers/>
                Publicação não encontrada.
            </div>
        );
    }

    return (

        <div
            style={{
                maxWidth: 720,
                margin: "30px auto",
                padding: 16,
            }}
        >
            <FloatingDrawers/>

            <FeedPost
                post={post}
            />

        </div>

    );

}