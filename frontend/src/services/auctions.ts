import { api } from "./api";

export async function getAuctions(
    tab?: string,
    cursor?: string | null,
    limit = 20,
) {
    const { data } = await api.get("/auctions", {
        params: {
            tab,
            cursor,
            limit,
        },
    });

    return data;
}

export async function getAuctionStats() {

    const { data } = await api.get(
        "/auctions/stats"
    );

    return data;

}