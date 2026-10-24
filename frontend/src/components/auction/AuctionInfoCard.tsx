import AuctionCountdown from "./AuctionCountdown";
import styles from "./AuctionInfoCard.module.css";

type Props = {

    product:any;

    highlight:boolean;

};

export default function AuctionInfoCard({
    product,
    highlight,
}:Props){

return (

<div
    className={`${styles.card} ${highlight ? styles.highlight : ""}`}
>

    <div>

        <div className={styles.label}>

            Lance atual

        </div>

        <div
            className={`${styles.currentBid} ${
                highlight ? styles.currentBidHighlight : ""
            }`}
        >

            {product.currentBid} MT

        </div>

    </div>

    <hr className={styles.divider} />

    <div className={styles.info}>

        <div>

            Lance inicial

            <strong>

                {product.auctionStartPrice} MT

            </strong>

        </div>

        <div>

            Incremento mínimo

            <strong>

                {product.minimumIncrement} MT

            </strong>

        </div>

        {product.reservePrice && (

            <div>

                Preço de reserva

                <strong>

                    {product.reservePrice} MT

                </strong>

            </div>

        )}

        <div>

            Termina em

            <AuctionCountdown
                endDate={product.auctionEndsAt}
            />

        </div>

    </div>

</div>

);

}