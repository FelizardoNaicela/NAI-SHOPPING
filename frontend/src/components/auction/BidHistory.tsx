import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { getSocket } from "../../socket/socket";
import styles from "./BidHistory.module.css";

type Props={
productId:string;
};

export default function BidHistory({

productId,

}:Props){

const [bids,setBids]=useState<any[]>([]);

useEffect(() => {

    const socket = getSocket();

    if (!socket) return;

    async function loadHistory() {

        try {

            const res = await api.get(
                `/auctions/${productId}/bids`
            );

            setBids(res.data);

        } catch {}

    }

    loadHistory();

    function handleNewBid(data:any){

        if(data.productId!==productId)
            return;

        loadHistory();

    }

    socket.on(
        "auction:newBid",
        handleNewBid,
    );

    return ()=>{

        socket.off(
            "auction:newBid",
            handleNewBid,
        );

    };

},[productId]);

const latestBids = bids.slice(0, 3);

const olderBids = bids.slice(3);

const [expanded, setExpanded] = useState(false);

const renderBid = (bid: any) => (

    <div
        key={bid.id}
        className={styles.bidItem}
    >

        <div>

            <strong>{bid.amount} MT</strong>

            {" • "}

            {bid.user.name}

            {bid.isWinning && (

                <span className={styles.winner}>

                    👑 Líder

                </span>

            )}

        </div>

    </div>

);

return (

<div className={styles.container}>

    <h3 className={styles.title}>

        Últimos lances

    </h3>

    {latestBids.map(renderBid)}

    {olderBids.length > 0 && (

        <div className={styles.moreContainer}>

            <button
                onClick={() =>
                    setExpanded(!expanded)
                }
                className={styles.moreButton}
            >

                {expanded

                    ? "Ocultar histórico"

                    : `Ver mais ${olderBids.length} lances`}

            </button>

        </div>

    )}

    {expanded && olderBids.map(renderBid)}

</div>

);

}