import { api } from "./api";

export async function searchGlobal(
    query: string,
    cursor?: string,
    limit = 20,
    filters?: {
        country?: string;
        region?: string;
        time?: string;
        sort?: string;
        type?: string,
    }
) {
    const { data } = await api.get(
        "/stores/search/global",
        {
            params: {
                q: query,
                cursor,
                limit,

                ...filters,
            },
        }
    );

    return data;
}

export async function searchSuggestions(query: string) {

    const { data } = await api.get(
        "/stores/search/suggestions",
        {
            params: {
                q: query,
            },
        }
    );

    return data;

}