import { useState } from "react";
import { getImageUrl } from "../../utils/image";
import { ImageGalleryModal } from "./ImageGalleryModal";

type Props = {
    section:
    | null
    | "gallery"
    | "audios"
    | "documents"
    | "locations"
    | "links";

    media: any;

    onClose(): void;
};

export function ConversationMediaViewer({
    section,
    media,
    onClose,
}: Props) {

    if (!section || !media) return null;

    const list = media[section] || [];

    const titles = {
    gallery: "Mídia",
    audios: "Áudios",
    documents: "Documentos",
    locations: "Localizações",
    links: "Links",
};

    const [galleryIndex, setGalleryIndex] =
    useState<number | null>(null);

    return (

        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "var(--background)",
color: "var(--text)",
                zIndex: 4000,
                overflowY: "auto",
            }}
        >

            <div
    style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "18px 24px",
        position: "sticky",
        top: 0,
        background: "var(--surface-glass)",

backdropFilter: "blur(18px)",

borderBottom: "1px solid var(--border)",

boxShadow: "var(--shadow-sm)",
        zIndex: 10,
    }}
>

    <div>

        <h2
            style={{
               fontSize:24,
fontWeight:700,
color:"var(--text)",
            }}
        >
            🖼 {titles[section]}
        </h2>

        <div
            style={{
                marginTop: 4,
                fontSize: 13,
                color:"var(--text-soft)",
            }}
        >
            {list.length} itens
        </div>

    </div>

    <button
        onClick={onClose}
        style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            cursor: "pointer",
           background:"var(--surface)",

border:"1px solid var(--border)",

color:"var(--text)",

boxShadow:"var(--shadow-sm)",

transition:"all .2s",
            fontSize: 18,
        }}

        onMouseEnter={(e)=>{
    e.currentTarget.style.background="var(--primary)";
    e.currentTarget.style.color="#fff";
}}

onMouseLeave={(e)=>{
    e.currentTarget.style.background="var(--surface)";
    e.currentTarget.style.color="var(--text)";
}}
    >
        ✕
    </button>

</div>

            <div
                style={{
                    padding: 20,
                    display:"flex",
flexDirection:"column",
gap:20,
                }}
            >

                {list.length === 0 && (

                    <div
style={{
padding:70,

textAlign:"center",

color:"var(--text-soft)",

fontSize:15,
}}
>

Nenhum item encontrado.

</div>

                )}

{section === "gallery" && (

<section>

<h2>Mídia</h2>

{media.gallery.length === 0 && (

<p>Nenhuma mídia.</p>

)}

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(90px, 1fr))",
    gap: 8,
  }}
>

{media.gallery.map((item:any,index:number)=>(

<div
  key={item.id}
  onClick={() => setGalleryIndex(index)}
  style={{
    position: "relative",
    aspectRatio: "1",
    borderRadius: 10,
    cursor: "pointer",
    background:"var(--surface)",

border:"1px solid var(--border)",

boxShadow:"var(--shadow-sm)",

overflow:"hidden",
    transition: ".25s",
  }}
onMouseEnter={(e)=>{
    e.currentTarget.style.transform="translateY(-5px)";
}}
onMouseLeave={(e)=>{
    e.currentTarget.style.transform="translateY(0px)";
}}
>

{item.type==="IMAGE" ? (

<img

src={getImageUrl(item.url)}

style={{
width:"100%",
height:"100%",
objectFit:"cover",
}}

/>

) : (

<div
style={{
position:"relative",
width:"100%",
height:"100%",
}}
>

<video

src={getImageUrl(item.url)}

muted

style={{
width:"100%",
height:"100%",
objectFit:"cover",
pointerEvents:"none",
}}

/>

<div
style={{
position:"absolute",
inset:0,
display:"flex",
justifyContent:"center",
alignItems:"center",
fontSize:26,
fontWeight:700,
backdropFilter:"blur(2px)",
color:"#fff",
background:"rgba(0,0,0,.25)",
}}
>

▶

</div>

</div>

)}

<div
style={{
position:"absolute",
bottom:0,
left:0,
right:0,
padding:6,
fontSize:11,
color:"#fff",
background:
"linear-gradient(transparent,rgba(0,0,0,.8))",
}}
>

<div
style={{
fontWeight:600,
}}
>

{item.senderName}

</div>

{new Date(item.createdAt)
.toLocaleDateString(
"pt-PT",
{
day:"numeric",
month:"short",
year:"numeric",
}
)}

</div>

</div>

))}

</div>

</section>

)}

                {section === "audios" &&

                    list.map((audio: any) => (
<div
style={{
    padding:18,

    borderRadius:18,

    background:"var(--surface)",

    border:"1px solid var(--border)",

    boxShadow:"var(--shadow-sm)",

    marginBottom:15,
}}
>
                        <audio
                            key={audio.id}
                            controls
                            style={{
                                width: "100%",
                                marginBottom: 15,
                            }}
                        >
                            <source
                                src={getImageUrl(audio.url)}
                            />
                        </audio>
                        </div>

                    ))}

                {section === "documents" &&

                    list.map((doc: any) => (
<div
style={{
display:"flex",
alignItems:"center",
justifyContent:"space-between",

padding:"16px 18px",

marginBottom:14,

borderRadius:16,

background:"var(--surface)",

border:"1px solid var(--border)",

boxShadow:"var(--shadow-sm)",
}}
>
                        <a
                            key={doc.id}
                            href={getImageUrl(doc.url)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: "block",
                                marginBottom: 15,
                            }}
                        >
                            📄 {doc.name}
                        </a>
</div>
                    ))}

                {section === "locations" &&

                    list.map((loc: any) => (
<div
style={{
background:"var(--surface)",
border:"1px solid var(--border)",
borderRadius:16,
padding:16,
boxShadow:"var(--shadow-sm)",
}}
>
                        <a
                            key={loc.id}
                            target="_blank"
                            rel="noreferrer"
                            href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                            style={{
                                display: "block",
                                marginBottom: 12,
                            }}
                        >
                            📍 {loc.latitude}, {loc.longitude}
                        </a>
</div>
                    ))}

                {section === "links" &&

                    list.map((link: any) => (

                        <a
                            key={link.id}
                            href={link.text}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: "block",
                                marginBottom: 15,
                            }}
                        >
                            <div
style={{
padding:16,

marginBottom:12,

background:"var(--surface)",

border:"1px solid var(--border)",

borderRadius:16,

boxShadow:"var(--shadow-sm)",

wordBreak:"break-word",
}}
>

🔗 {link.text}

</div>
                        </a>

                    ))}

                    {galleryIndex !== null && (

<ImageGalleryModal

    images={media.gallery}

    initialIndex={galleryIndex}

    onClose={() =>
        setGalleryIndex(null)
    }

/>

)}

            </div>

        </div>

    );
}