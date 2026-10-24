import { useRef, useState } from "react";

import { uploadAvatar } from "../../services/users";

import styles from "./AvatarUploader.module.css";

type Props = {

    avatarUrl?: string;

    onUploaded: (avatarUrl: string) => void;

};

export default function AvatarUploader({

    avatarUrl,

    onUploaded,

}: Props) {
    const API_URL = import.meta.env.VITE_API_URL;

    const inputRef =
        useRef<HTMLInputElement>(null);

    const [uploading, setUploading] =
        useState(false);

    const [preview, setPreview] =
        useState<string | null>(null);

    async function handleFile(

        e: React.ChangeEvent<HTMLInputElement>,

    ) {

        const file =
            e.target.files?.[0];

        if (!file)
            return;

        // Preview imediato

        const localPreview =
            URL.createObjectURL(file);

        setPreview(localPreview);

        try {

            setUploading(true);

            const user =
                await uploadAvatar(file);

            onUploaded(user.avatarUrl);

            setPreview(null);

        } catch (err) {


            alert("Erro ao enviar avatar.");

            setPreview(null);

        } finally {

            setUploading(false);

        }

    }

   return (

    <div className={styles.wrapper}>

        <div className={styles.avatar}>

            {

                preview ? (

                    <img
                        src={preview}
                        alt="Preview"
                    />

                ) : avatarUrl ? (

                    <img
                        src={`${API_URL}${avatarUrl}`}
                        alt="Avatar"
                    />

                ) : (

                    <span className={styles.placeholder}>
                        👤
                    </span>

                )

            }

        </div>

        <input
            ref={inputRef}
            type="file"
            hidden
            accept="image/*"
            onChange={handleFile}
        />

        <button
            className={styles.button}
            disabled={uploading}
            onClick={() =>
                inputRef.current?.click()
            }
        >

            {

                uploading

                    ? "Enviando..."

                    : "Alterar foto"

            }

        </button>

    </div>

);

}