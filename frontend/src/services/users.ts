import { api } from "./api";

export async function getMyProfile() {
    const { data } = await api.get("/users/me");
    return data;
}

export async function updateProfile(payload: {
    username?: string;
    name?: string;
    phone?: string;
    bio?: string;
    countryCode?: string;
    region?: string;
}) {
    const { data } = await api.patch(
        "/users/me",
        payload,
    );

    return data;
}

export async function uploadAvatar(file: File) {

    const form = new FormData();

    form.append(
        "file",
        file,
    );

    const { data } = await api.post(
        "/users/me/avatar",
        form,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        },
    );

    return data;
}

export async function changeEmail(
    newEmail: string,
    currentPassword: string,
) {

    const { data } = await api.patch(
        "/users/me/email",
        {
            newEmail,
            currentPassword,
        },
    );

    return data;
}

export async function changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
) {

    const { data } = await api.patch(
        "/users/me/password",
        {
            currentPassword,
            newPassword,
            confirmPassword,
        },
    );

    return data;
}

export async function deleteAccount(
    password: string,
) {

    const { data } = await api.delete(
        "/users/me",
        {
            data: {
                password,
            },
        },
    );

    return data;
}

export async function refreshProfile() {
    const profile = await getMyProfile();

    localStorage.setItem(
        "user",
        JSON.stringify(profile),
    );

    return profile;
}

export async function getPublicProfile(
    username: string,
) {

    const { data } = await api.get(
        `/users/${username}`,
    );

    return data;

}