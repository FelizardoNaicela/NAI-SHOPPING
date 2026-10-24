import { useState } from "react";

import { changePassword } from "../../services/users";

import styles from "./ChangePasswordForm.module.css";

export default function PasswordForm() {

    const [current, setCurrent] =
        useState("");

    const [next, setNext] =
        useState("");

    const [confirm, setConfirm] =
        useState("");

    async function submit() {

        try {

            await changePassword(

                current,

                next,

                confirm,

            );

            alert("Senha alterada.");

            setCurrent("");
            setNext("");
            setConfirm("");

        } catch {

            alert("Erro ao alterar senha.");

        }

    }

return (

    <div className={styles.card}>

        <h3 className={styles.title}>
            Alterar palavra-passe
        </h3>

        <input
            className={styles.input}
            type="password"
            placeholder="Senha atual"
            value={current}
            onChange={e =>
                setCurrent(e.target.value)
            }
        />

        <input
            className={styles.input}
            type="password"
            placeholder="Nova senha"
            value={next}
            onChange={e =>
                setNext(e.target.value)
            }
        />

        <input
            className={styles.input}
            type="password"
            placeholder="Confirmar"
            value={confirm}
            onChange={e =>
                setConfirm(e.target.value)
            }
        />

        <button
            className={styles.submitButton}
            onClick={submit}
        >

            Alterar

        </button>

    </div>

);
}