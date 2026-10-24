import { useState } from "react";

import AvatarUploader from "./AvatarUploader";
import EditProfileForm from "./EditProfileForm";
import ChangeEmailForm from "./ChangeEmailForm";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountCard from "./DeleteAccountCard";

import styles from "./ProfileInfo.module.css";

type Store = {
    id: string;
    name: string;
    avatarUrl?: string;
    verified: boolean;
};

type Profile = {
    id: string;
    username?: string;
    name?: string;
    email: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    countryCode?: string;
    region?: string;
    role: string;
    createdAt: string;
    stores: Store[];
};

type Props = {
    profile: Profile;
    showEditOptions: boolean;
};

type Section =
    | "profile"
    | "email"
    | "password"
    | "delete"
    | null;

export default function ProfileInfo({
    profile,
    showEditOptions,
}: Props) {

    const [currentProfile, setCurrentProfile] =
        useState(profile);

    const [section, setSection] =
    useState<Section>(null);

    return (

        <div className={styles.wrapper}>

            <section className={styles.card}>

    <h2>Meu Perfil</h2>

    <AvatarUploader
        avatarUrl={currentProfile.avatarUrl}
        onUploaded={(avatarUrl) =>
            setCurrentProfile({
                ...currentProfile,
                avatarUrl,
            })
        }
    />

</section>

{showEditOptions && (


            <div className={styles.menu}>

                <div className={styles.settingCard}>

    <button
        className={`${styles.settingButton} ${
            section === "profile"
                ? styles.active
                : ""
        }`}
        onClick={() =>
            setSection(
                section === "profile"
                    ? null
                    : "profile"
            )
        }
    >

        <span>👤 Editar perfil</span>

        <span>
            {section === "profile"
                ? "▼"
                : "›"}
        </span>

    </button>

    {section === "profile" && (

        <EditProfileForm
            profile={currentProfile}
            onUpdated={setCurrentProfile}
        />

    )}

</div>


                <div className={styles.settingCard}>

    <button
        className={`${styles.settingButton} ${
            section === "email"
                ? styles.active
                : ""
        }`}
        onClick={() =>
            setSection(
                section === "email"
                    ? null
                    : "email"
            )
        }
    >

        <span>📧 Alterar email</span>

        <span>
            {section === "email"
                ? "▼"
                : "›"}
        </span>

    </button>

    {section === "email" && (

        <ChangeEmailForm />

    )}

</div>

 <div className={styles.settingCard}>

    <button
        className={`${styles.settingButton} ${
            section === "password"
                ? styles.active
                : ""
        }`}
        onClick={() =>
            setSection(
                section === "password"
                    ? null
                    : "password"
            )
        }
    >

        <span>🔒 Palavra-passe</span>

        <span>
            {section === "password"
                ? "▼"
                : "›"}
        </span>

    </button>

    {section === "password" && (

        <ChangePasswordForm />

    )}

</div>


                <div className={styles.settingCard}>

    <button
        className={`${styles.settingButton} ${
            section === "delete"
                ? styles.active
                : ""
        }`}
        onClick={() =>
            setSection(
                section === "delete"
                    ? null
                    : "delete"
            )
        }
    >

        <span>🗑 Eliminar conta</span>

        <span>
            {section === "delete"
                ? "▼"
                : "›"}
        </span>

    </button>

    {section === "delete" && (

        <DeleteAccountCard />

    )}

</div>

            </div>
            )}
        </div>

    );

}