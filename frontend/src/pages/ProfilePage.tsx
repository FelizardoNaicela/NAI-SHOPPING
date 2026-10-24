import { useEffect, useState } from "react";
import FloatingDrawers from "../components/drawer/FloatingDrawers";

import { getMyProfile } from "../services/users";

import ProfileSidebar from "../components/profile/ProfileSidebar";
import ProfileInfo from "../components/profile/ProfileInfo";

import styles from "../components/profile/ProfilePage.module.css";

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

export default function ProfilePage() {

    const [profile, setProfile] =
        useState<Profile | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [showEditOptions, setShowEditOptions] =
        useState(false);

    const [isMobile, setIsMobile] =
        useState(
            window.innerWidth < 900,
        );

    useEffect(() => {

        function handleResize() {

            setIsMobile(
                window.innerWidth < 900,
            );

        }

        window.addEventListener(
            "resize",
            handleResize,
        );

        return () =>

            window.removeEventListener(
                "resize",
                handleResize,
            );

    }, []);

    useEffect(() => {

        async function loadProfile() {

            try {

                const data =
                    await getMyProfile();

                setProfile(data);

            } catch (err) {



            } finally {

                setLoading(false);

            }

        }

        loadProfile();

    }, []);

    if (loading) {

        return (

            <div className={styles.loading}>

                Carregando perfil...

            </div>

        );

    }

    if (!profile) {

        return (

            <div className={styles.loading}>

                Perfil não encontrado.

            </div>

        );

    }

    return (

        <>

            <FloatingDrawers />

            <div className={styles.page}>

                {

                    !isMobile && (

                        <ProfileSidebar
    profile={profile}
    onEditProfile={() =>
        setShowEditOptions(value => !value)
    }
/>

                    )

                }

                <main className={styles.content}>

                    {

                        isMobile && (

                            <ProfileSidebar
    profile={profile}
    onEditProfile={() =>
        setShowEditOptions(value => !value)
    }
/>

                        )

                    }

                    {showEditOptions && (
    <ProfileInfo
        profile={profile}
        showEditOptions={showEditOptions}
    />
)}

                </main>

            </div>

        </>

    );

}