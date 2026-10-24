import { useState } from "react";
import { api } from "../../services/api";
import toast from "react-hot-toast";
import styles from "./BidBox.module.css";

type Props = {

product:any;

onBidPlaced:(value:number)=>void;

}

export default function BidBox({

product,

onBidPlaced,

}:Props){

const [value,setValue]=useState("");

const [loading,setLoading]=useState(false);

async function bid(){

    try{

        setLoading(true);

        const response = await api.post(
            `/auctions/${product.id}/bid`,
            {
                amount:Number(value),
            }
        );

        setValue("");

        onBidPlaced(response.data.currentBid);
        toast.success(
  "Licitação realizada! Está agora na liderança."
);

    }
    catch(err:any){
        toast.error(
    err.response?.data?.message ??
    "Erro ao licitar."
);

    }
    finally{

        setLoading(false);

    }

}

const minimum=

(product.currentBid||product.auctionStartPrice)+

product.minimumIncrement;

return (

<div className={styles.container}>

    <div className={styles.minimum}>

        Lance mínimo:

        <strong>{minimum} MT</strong>

    </div>

    <input
        className={styles.input}
        type="number"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Digite o seu lance"
    />

    <button
        className={styles.button}
        onClick={bid}
        disabled={loading}
    >

        {loading
            ? "Enviando..."
            : "Dar lance"}

    </button>

</div>

);

}