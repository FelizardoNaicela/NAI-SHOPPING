import { Link } from "react-router-dom";
import styles from "./DrawerProfile.module.css";
import { CircleUserRound } from "lucide-react";
import { User } from "lucide-react";

type DrawerProfileProps = {
    isAuthenticated: boolean;
    user?: any;
};

export default function DrawerProfile({

    isAuthenticated,
    user,

}: DrawerProfileProps) {


    function getInitial(){

        if(!user?.name)
            return "U";

        return user.name
            .charAt(0)
            .toUpperCase();

    }


    if (!isAuthenticated) {

        return (

            <div className={styles.card}>

                <div className={styles.avatar}>
                 <CircleUserRound
    size={36}
    strokeWidth={1.8}
/>
                </div>


                <h3>
                    Bem-vindo
                </h3>


                <p>
                    Entre para continuar.
                </p>


                <Link
                    to="/login"
                    className={styles.button}
                >
                    Entrar
                </Link>


            </div>

        );

    }


    return (

        <div className={styles.card}>


            <div className={styles.avatar}>


                {
                    user?.avatarUrl ? (

                       <img
    src={
        user?.avatarUrl
            ? `http://localhost:3000${user.avatarUrl}`
            : "/default-avatar.png"
    }
    alt="Avatar"
/>

                    ) : (

                        <span>
                            {getInitial()}
                        </span>

                    )

                }


            </div>


            <h3>
                {user?.name ?? "Utilizador"}
            </h3>


            <p>
                {user?.email}
            </p>


            <Link
    to="/profile"
    className={styles.button}
>
                <User size={17}/>
Ver perfil
            </Link>


        </div>

    );

}