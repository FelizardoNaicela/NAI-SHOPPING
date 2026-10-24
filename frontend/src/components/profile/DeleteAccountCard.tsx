import { useState } from "react";

import { deleteAccount } from "../../services/users";

import { useAuth } from "../../auth/AuthProvider";

import styles from "./DeleteAccountCard.module.css";

export default function DeleteAccount() {

    const [password, setPassword] =
        useState("");

    const { logout } = useAuth();

    async function remove() {

        if (

            !confirm(
                "Eliminar permanentemente a conta?"
            )

        ) return;

        try {

            await deleteAccount(password);

            logout();

        } catch {

            alert("Senha incorreta.");

        }

    }

return (

    <div className={styles.card}>

        <h3 className={styles.title}>
            Eliminar conta
        </h3>

        <input
            className={styles.input}
            type="password"
            placeholder="Confirme a senha"
            value={password}
            onChange={e =>
                setPassword(e.target.value)
            }
        />

        <button
            className={styles.submitButton}
            onClick={remove}
        >

            Eliminar conta

        </button>

    </div>

);

}