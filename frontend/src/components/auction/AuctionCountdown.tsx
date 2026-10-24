import { useEffect, useState } from "react";
import styles from "./AuctionCountdown.module.css";

type Props = {
    endDate: string;
    onFinish?: () => void;
};

export default function AuctionCountdown({
    endDate,
    onFinish,
}: Props) {

    const [timeLeft, setTimeLeft] = useState("");

    const [currentEndDate, setCurrentEndDate] =
    useState(endDate);

    useEffect(() => {
    setCurrentEndDate(endDate);
}, [endDate]);

    useEffect(() => {

        const interval = setInterval(() => {

            const diff =
                new Date(currentEndDate).getTime() -
                Date.now();

            if (diff <= 0) {

                setTimeLeft("Encerrado");

                clearInterval(interval);

                onFinish?.();

                return;
            }

            const days = Math.floor(diff / 86400000);

            const hours = Math.floor(
                (diff % 86400000) / 3600000
            );

            const minutes = Math.floor(
                (diff % 3600000) / 60000
            );

            const seconds = Math.floor(
                (diff % 60000) / 1000
            );

            setTimeLeft(
                `${days}d ${hours}h ${minutes}m ${seconds}s`
            );

        }, 1000);

        return () => clearInterval(interval);

    }, [currentEndDate]);

   return (

    <div className={styles.countdown}>

        {timeLeft}

    </div>

);

}