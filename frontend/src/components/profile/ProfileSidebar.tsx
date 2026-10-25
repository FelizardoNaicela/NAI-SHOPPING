import { Link } from "react-router-dom";

import styles from "./ProfileSidebar.module.css";
import { getImageUrl } from "../../utils/image";

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
    onEditProfile?: () => void;
};

export default function ProfileSidebar({
    profile,
    onEditProfile,
}: Props) {

    function getInitial() {

        if (!profile.name)
            return "U";

        return profile.name
            .charAt(0)
            .toUpperCase();

    }

    return (

        <aside className={styles.sidebar}>

            <div className={styles.card}>

                <div className={styles.avatar}>

                    {

                        profile.avatarUrl ? (

                            <img
    src={getImageUrl(profile.avatarUrl)}
    alt={profile.name}
/>

                        ) : (

                            <span>

                                {getInitial()}

                            </span>

                        )

                    }

                </div>

                <h2>

                    {profile.name}

                </h2>

                {

                    profile.username && (

                        <div className={styles.username}>

                            @{profile.username}

                        </div>

                    )

                }

                <div className={styles.email}>

                    {profile.email}

                </div>

                {

                    profile.bio && (

                        <p className={styles.bio}>

                            {profile.bio}

                        </p>

                    )

                }

                <button
    className={styles.editButton}
    onClick={onEditProfile}
>
    Editar Perfil
</button>

            </div>

            {

                profile.stores.length > 0 && (

                    <div className={styles.card}>

                        <h3>

                            Minhas Bancas

                        </h3>

                        {

                            profile.stores.map(store => (

                                <Link

                                    key={store.id}

                                    to={`/stores/${store.id}`}

                                    className={styles.store}

                                >

                                    <div className={styles.storeAvatar}>

                                        {

                                            store.avatarUrl ? (

                                                <img
    src={getImageUrl(store.avatarUrl)}
    alt={store.name}
/>

                                            ) : (

                                                store.name
                                                    .charAt(0)
                                                    .toUpperCase()

                                            )

                                        }

                                    </div>

                                    <div>

                                        <div className={styles.storeName}>

                                            {store.name}

                                        </div>

                                        {

                                            store.verified && (

                                                <div
                                                    className={styles.verified}
                                                >

                                                    ✔ Verificada

                                                </div>

                                            )

                                        }

                                    </div>

                                </Link>

                            ))

                        }

                    </div>

                )

            }

        </aside>

    );

}