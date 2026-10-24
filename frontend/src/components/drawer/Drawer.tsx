import styles from "./Drawer.module.css";
import { X } from "lucide-react";

type DrawerProps = {

    open: boolean;

    onClose: () => void;

    title?: string;

    side?: "left" | "right";

    children: React.ReactNode;

};

export default function Drawer({

    open,

    onClose,

    title,

    side = "left",

    children,

}: DrawerProps) {

    return (

        <>

            <div
                className={`${styles.backdrop} ${
                    open
                        ? styles.backdropOpen
                        : ""
                }`}
                onClick={onClose}
            />

            <div
                className={`
                    ${styles.drawer}
                    ${styles[side]}
                    ${open ? styles.open : ""}
                `}
            >

                <div className={styles.header}>

                    <div className={styles.title}>
                        {title}
                    </div>

                    <button
    className={styles.close}
    onClick={onClose}
>
    <X size={20} />
</button>

                </div>

                <div className={styles.content}>
                    {children}
                </div>

            </div>

        </>

    );

}