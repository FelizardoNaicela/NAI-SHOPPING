import { useEffect } from "react";
import {
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";
import styles from "./ProductFullscreen.module.css"

type Props = {
    images: string[];

    selectedIndex: number;

    onSelect: (index: number) => void;

    onClose: () => void;
};

export default function ProductFullscreen({

    images,

    selectedIndex,

    onSelect,

    onClose,

}: Props) {

    const current = images[selectedIndex];

    const API_URL = import.meta.env.VITE_API_URL;

const finalSrc =
    current?.startsWith("http")
        ? current
        : API_URL + current;

    useEffect(() => {

        function handleKey(e: KeyboardEvent) {

            if (e.key === "Escape")
                onClose();

            if (e.key === "ArrowRight") {

                onSelect(
                    (selectedIndex + 1) %
                    images.length
                );

            }

            if (e.key === "ArrowLeft") {

                onSelect(

                    (selectedIndex - 1 + images.length) %
                    images.length

                );

            }

        }

        window.addEventListener(
            "keydown",
            handleKey,
        );

        document.body.style.overflow = "hidden";

        return () => {

            window.removeEventListener(
                "keydown",
                handleKey,
            );

            document.body.style.overflow = "";

        };

    }, [

        selectedIndex,

        images,

        onSelect,

        onClose,

    ]);

    return (

        <div

            onClick={onClose}

            className={styles.overlay}

        >


            <button

                onClick={e => {

                    e.stopPropagation();

                    onClose();

                }}

                className={styles.iconButton}
    style={{
        position: "absolute",
        top: 20,
        right: 20,
    }}
>
    <X size={22} />

            </button>

            <div className={styles.counter}>
    {selectedIndex + 1} / {images.length}
</div>

            {images.length > 1 && (

                <>

                    <button

                        onClick={e => {

                            e.stopPropagation();

                            onSelect(

                                (selectedIndex - 1 + images.length) %

                                images.length

                            );

                        }}

                        className={styles.iconButton}
    style={{
        position: "absolute",
        left: 20,
        top: "50%",
        transform: "translateY(-50%)",
    }}
>
    <ChevronLeft size={28}/>

                    </button>

                    <button

                        onClick={e => {

                            e.stopPropagation();

                            onSelect(

                                (selectedIndex + 1) %

                                images.length

                            );

                        }}

                        className={styles.iconButton}
    style={{
        position: "absolute",
        right: 20,
        top: "50%",
        transform: "translateY(-50%)",
    }}
>
    <ChevronRight size={28}/>

                    </button>

                </>

            )}

            <img
className={styles.image}
    src={finalSrc}
    alt="Produto"
    onClick={(e) => e.stopPropagation()}

            />

            {images.length > 1 && (

                <div

                    style={{

                        position: "absolute",

                        bottom: 30,

                        display: "flex",

                        gap: 8,

                    }}

                >

                    {images.map((_, i) => (

                        <div

                          key={i}
    onClick={(e) => {
        e.stopPropagation();
        onSelect(i);
    }}
    className={`${styles.dot} ${
        selectedIndex === i ? styles.active : ""
    }`}

                        />

                    ))}

                </div>

            )}
        </div>

    );

}