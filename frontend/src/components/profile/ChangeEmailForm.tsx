import { useState } from "react";

import { changeEmail } from "../../services/users";

import styles from "./ChangeEmailForm.module.css";

export default function EmailForm() {

    const [newEmail, setNewEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    async function submit() {

        try {

            setLoading(true);

            await changeEmail(
                newEmail,
                password,
            );

            alert("Email atualizado.");

            setNewEmail("");
            setPassword("");

        } catch {

            alert("Erro ao alterar email.");

        } finally {

            setLoading(false);

        }

    }

    return (

    <div className={styles.card}>

        <h3 className={styles.title}>
            Alterar email
        </h3>

        <input
            className={styles.input}
            placeholder="Novo email"
            value={newEmail}
            onChange={e =>
                setNewEmail(e.target.value)
            }
        />

        <input
            className={styles.input}
            type="password"
            placeholder="Senha atual"
            value={password}
            onChange={e =>
                setPassword(e.target.value)
            }
        />

        <button
            className={styles.submitButton}
            disabled={loading}
            onClick={submit}
        >

            Guardar

        </button>

    </div>

);

}