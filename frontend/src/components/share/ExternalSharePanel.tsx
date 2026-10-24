import {
    MessageCircle,
    Send,
    Facebook,
    Mail,
    Copy,
} from "lucide-react";
import styles from "./ExternalSharePanel.module.css";
import toast from "react-hot-toast";

type Props = {
    url: string;
};

export default function ExternalSharePanel({
    url,
}: Props) {

    function open(link: string) {
        window.open(
            link,
            "_blank",
            "noopener,noreferrer"
        );
    }

    async function copyLink() {

        await navigator.clipboard.writeText(
            url
        );

        toast.success("Link copiado.");

    }

return (

    <div className={styles.container}>

        <ShareItem
            icon={<MessageCircle size={22}/>}
            label="WhatsApp"
            onClick={() =>
                open(
                    `https://wa.me/?text=${encodeURIComponent(url)}`
                )
            }
        />

        <ShareItem
            icon={<Send size={22}/>}
            label="Telegram"
            onClick={() =>
                open(
                    `https://t.me/share/url?url=${encodeURIComponent(url)}`
                )
            }
        />

        <ShareItem
            icon={<Facebook size={22}/>}
            label="Facebook"
            onClick={() =>
                open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
                )
            }
        />

        <ShareItem
            icon={<span className={styles.xIcon}>X</span>}
            label="X"
            onClick={() =>
                open(
                    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`
                )
            }
        />

        <ShareItem
            icon={<Mail size={22}/>}
            label="Email"
            onClick={() =>
                window.location.href =
                    `mailto:?subject=Veja isto&body=${encodeURIComponent(url)}`
            }
        />

        <ShareItem
            icon={<Copy size={22}/>}
            label="Copiar"
            onClick={copyLink}
        />

    </div>

);

}

type ItemProps = {

    icon: React.ReactNode;

    label: string;

    onClick(): void;

};

function ShareItem({
    icon,
    label,
    onClick,
}: ItemProps){

    return(

        <button
            onClick={onClick}
            className={styles.item}
        >

            {icon}

            <span className={styles.label}>

                {label}

            </span>

        </button>

    );

}