import { useEffect } from "react";
import {
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";

import { api } from "../../services/api";
import { getSocket } from "../../socket/socket";

export default function StartChatFromProduct() {

    const { storeId } = useParams();

    const [params] = useSearchParams();

    const productId = params.get("product");

    const navigate = useNavigate();

    useEffect(() => {

        async function start() {

            if (!storeId || !productId) return;

            //
            // cria ou obtém conversa
            //

            const { data } =
                await api.post(
                    "/chat/start",
                    {
                        storeId,
                    },
                );

            const conversationId = data.id;

            //
            // envia o produto automaticamente
            //

            const socket = getSocket();

            socket?.emit(
                "chat:share-link",
                {
                    conversationId,
                    sharedProductId:
                        productId,
                },
            );

            //
            // abre o chat
            //

            navigate(
                `/chat?conversation=${conversationId}`,
                {
                    replace: true,
                },
            );

        }

        start();

    }, []);

    return null;
}