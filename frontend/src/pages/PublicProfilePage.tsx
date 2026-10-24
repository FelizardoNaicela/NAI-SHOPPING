import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPublicProfile } from "../services/users";

import ProfileSidebar from "../components/profile/ProfileSidebar";

import styles from "../components/profile/ProfilePage.module.css";
import FloatingDrawers from "../components/drawer/FloatingDrawers";

export default function PublicProfilePage() {

    const { username } = useParams();

    const [profile, setProfile] =
        useState<any>(null);

    const [loading, setLoading] =
        useState(true);

    const [isMobile, setIsMobile] =
        useState(window.innerWidth < 900);

    useEffect(() => {

        function resize() {

            setIsMobile(
                window.innerWidth < 900,
            );

        }

        window.addEventListener(
            "resize",
            resize,
        );

        return () =>

            window.removeEventListener(
                "resize",
                resize,
            );

    }, []);

    useEffect(() => {

        if (!username) return;

        getPublicProfile(username)

            .then(setProfile)

            .finally(() =>

                setLoading(false),

            );

    }, [username]);

    if (loading)
        return <p>Carregando...</p>;

    if (!profile)
        return <p>Perfil não encontrado.</p>;

    return (

        <div className={styles.page}>
            <FloatingDrawers />

            {

                !isMobile && (

                    <ProfileSidebar

                        profile={profile}

                    />

                )

            }

            <main className={styles.content}>

                {

                    isMobile && (

                        <ProfileSidebar

                            profile={profile}

                        />

                    )

                }

                <div className={styles.card}>

                    <h2>

                        Sobre

                    </h2>

                    <p>

                        {profile.bio ||

                            "Sem biografia."}

                    </p>

                </div>

                <div className={styles.card}>

                    <h2>

                        Bancas

                    </h2>

                    {

                        profile.stores.length === 0 && (

                            <p>

                                Este utilizador ainda não possui bancas.

                            </p>

                        )

                    }

                    {

                        profile.stores.map((store:any)=>(

                           <div
key={store.id}
style={{
    padding:"14px 0",
    borderBottom:"1px solid var(--border)",
}}
>

<a
href={`/stores/${store.id}`}
style={{
    color:"var(--text)",
    textDecoration:"none",
    fontWeight:600,
}}
>

{store.name}

</a>

</div>

                        ))

                    }

                </div>

            </main>

        </div>

    );

}