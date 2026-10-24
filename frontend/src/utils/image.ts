const API_URL = "http://localhost:3000";

export function getImageUrl(
    path?: string | null,
): string {

    if (!path) {

        return "/default-avatar.png";

    }

    // Se já for uma URL completa
    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {

        return path;

    }

    // Garante que existe apenas uma "/"
    if (path.startsWith("/")) {

        return `${API_URL}${path}`;

    }

    return `${API_URL}/${path}`;

}