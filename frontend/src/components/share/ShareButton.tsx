import { Share2 } from "lucide-react";

type Props = {
    onClick(): void;
};

export default function ShareButton({
    onClick,
}: Props) {

    return (

        <button
            onClick={(e)=>{
                e.stopPropagation();
                onClick();
            }}
            style={{
                width:34,
                height:34,
                borderRadius:"50%",
                border:"none",
                background:"var(--surface)",
                cursor:"pointer",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
boxShadow:"var(--shadow-md)"            }}
        >
            <Share2 size={17}/>
        </button>

    );
}