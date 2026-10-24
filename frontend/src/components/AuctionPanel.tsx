import { Trophy } from "lucide-react";

import PanelSection from "./panel/PanelSection";
import styles from "./AuctionPanel.module.css";

type Props = {
  highestAuctions: any[];
};

function getPrice(auction: any): number | null {
  const value = auction.currentBid ?? auction.auctionStartPrice;

  return typeof value === "number" ? value : null;
}

function formatPrice(value: number | null) {
  return value === null ? "—" : `${value.toLocaleString("pt-MZ")} MT`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function AuctionPanel({ highestAuctions }: Props) {
  const top = highestAuctions[0];

  return (
    <PanelSection
      title="Top 10 maiores lances"
      description="Os leilões com os valores mais altos neste momento."
      icon={<Trophy size={20} strokeWidth={1.9} />}
      storageKey="auctions:top"
      summary={top ? formatPrice(getPrice(top)) : undefined}
    >
      {highestAuctions.length === 0 ? (
        <div className={styles.empty}>Ainda não há lances para mostrar.</div>
      ) : (
        <ol className={styles.list}>
          {highestAuctions.map((auction, index) => (
            <li key={auction.id} className={styles.item}>
              <span
                className={`${styles.rank} ${index < 3 ? styles.rankTop : ""}`}
              >
                {index < 3 ? MEDALS[index] : index + 1}
              </span>

              <div className={styles.info}>
                <span className={styles.name}>{auction.name}</span>

                {auction.store?.name && (
                  <span className={styles.store}>{auction.store.name}</span>
                )}
              </div>

              <strong className={styles.price}>
                {formatPrice(getPrice(auction))}
              </strong>
            </li>
          ))}
        </ol>
      )}
    </PanelSection>
  );
}