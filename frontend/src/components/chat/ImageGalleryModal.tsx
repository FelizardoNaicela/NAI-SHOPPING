import {
    useEffect,
    useState,
} from "react";

import { getImageUrl } from "../../utils/image";
import { ZoomableImage } from "../common/ZoomableImage/ZoomableImage";

type Props = {
    images: {
    id: string;
    url: string;
    type?: "IMAGE" | "VIDEO";
    createdAt?: string;
    senderName?: string;
}[];

    initialIndex: number;

    onClose(): void;
};

export function ImageGalleryModal({
    images,
    initialIndex,
    onClose,
}: Props) {

const [index, setIndex] = useState(initialIndex);

   useEffect(() => {
  setIndex(initialIndex);
}, [initialIndex]);

    useEffect(() => {

        function handleKey(
            e: KeyboardEvent,
        ) {

            if (e.key === "Escape")
                onClose();

            if (e.key === "ArrowLeft")
                previous();

            if (e.key === "ArrowRight")
                next();

        }

        window.addEventListener(
            "keydown",
            handleKey,
        );

        return () =>
            window.removeEventListener(
                "keydown",
                handleKey,
            );

    });

    useEffect(()=>{

    const next=images[index+1];

    if(next){

        new Image().src=
            getImageUrl(next.url);

    }

},[index]);

    const current =
        images[index];

        const isVideo =
    current.type === "VIDEO" ||
    /\.(mp4|webm|ogg|mov)$/i.test(current.url);

    function previous() {

        if (index === 0) return;

        setIndex(index - 1);

    }

    function next() {

        if (
            index ===
            images.length - 1
        )
            return;

        setIndex(index + 1);

    }



    function downloadImage() {

        const link =
            document.createElement("a");

        link.href =
            getImageUrl(
                current.url,
            );

        link.download =
            "imagem";

        link.click();

    }

    async function shareImage() {

        if (
            navigator.share
        ) {

            await navigator.share({

                title:
                    "Imagem",

                url:
                    getImageUrl(
                        current.url,
                    ),

            });

        }

    }

    return (

        <div

    onClick={onClose}

    style={{
        position:"fixed",
        inset:0,
        background:"rgba(0,0,0,.95)",
        zIndex:5000,
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
    }}
>

            <button
                onClick={(e) => {

                    e.stopPropagation();

                    previous();

                }}
                style={{
                    position:
                        "absolute",
                    left: 20,
                    fontSize: 40,
                    background:
                        "none",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                }}
            >
                ‹
            </button>

            {isVideo ? (

    <video
        src={getImageUrl(current.url)}
        controls
        autoPlay
        playsInline
        style={{
            maxWidth: "90%",
            maxHeight: "90%",
            borderRadius: 12,
            background: "#000",
        }}
        onClick={(e) => e.stopPropagation()}
    />

) : (

    <ZoomableImage
        src={getImageUrl(current.url)}
        style={{
            maxWidth: "90%",
            maxHeight: "90%",
            objectFit: "contain",
        }}
    />

)}

            <button
                onClick={(e) => {

                    e.stopPropagation();

                    next();

                }}
                style={{
                    position:
                        "absolute",
                    right: 20,
                    fontSize: 40,
                    background:
                        "none",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                }}
            >
                ›
            </button>

            <div
                style={{
                    position:
                        "absolute",
                    bottom: 22,
                    left: 0,
                    right: 0,
                    textAlign:
                        "center",
                    color: "#fff",
                }}
            >

                <div
                    style={{
                        fontWeight:
                            600,
                    }}
                >
                    {current.senderName}
                </div>

                {current.createdAt && (

                    <div
                        style={{
                            fontSize: 12,
                            opacity: .8,
                        }}
                    >
                        {new Date(
                            current.createdAt,
                        ).toLocaleString()}
                    </div>

                )}

                <div
                    style={{
                        marginTop: 8,
                    }}
                >
                    {index + 1} / {images.length}
 <div

    style={{

        position:"absolute",

        bottom:60,

        left:0,

        right:0,

        display:"flex",

        justifyContent:"center",

        gap:8,

        overflowX:"auto",

        padding:"10px 20px",

    }}

    onClick={(e)=>e.stopPropagation()}

>

 {images.map((img, i) => {

    const isThumbVideo =
        img.type === "VIDEO" ||
        /\.(mp4|webm|ogg|mov)$/i.test(img.url);

    return isThumbVideo ? (

        <div
            key={img.id}
            onClick={() => {

                setIndex(i);
            }}
            style={{
                width: 70,
                height: 70,
                borderRadius: 8,
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
                opacity: i === index ? 1 : .55,
                border:
                    i === index
                        ? "3px solid #0a84ff"
                        : "2px solid transparent",
            }}
        >

            <video
                src={getImageUrl(img.url)}
                muted
                playsInline
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#fff",
                    fontSize: 22,
                    fontWeight: 700,
                    background: "rgba(0,0,0,.25)",
                }}
            >
                ▶
            </div>

        </div>

    ) : (

        <img
            key={img.id}
            src={getImageUrl(img.url)}
            onClick={() => {

                setIndex(i);
            }}
            style={{
                width: 70,
                height: 70,
                objectFit: "cover",
                borderRadius: 8,
                cursor: "pointer",
                opacity: i === index ? 1 : .55,
                border:
                    i === index
                        ? "3px solid #0a84ff"
                        : "2px solid transparent",
                transition: ".2s",
            }}
        />

    );

})}

</div>
                </div>

            </div>

            <div
                style={{
                    position:
                        "absolute",
                    top: 20,
                    right: 25,
                    display:
                        "flex",
                    gap: 12,
                }}
            >

                <button
                    onClick={(e) => {

                        e.stopPropagation();

                        downloadImage();

                    }}
                >
                    ⬇
                </button>

                {"share" in navigator && (

                    <button
                        onClick={(e) => {

                            e.stopPropagation();

                            shareImage();

                        }}
                    >
                        ⤴
                    </button>

                )}

            </div>

        </div>

    );

}