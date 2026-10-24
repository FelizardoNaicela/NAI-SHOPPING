import { useEffect, useState } from "react";

type Props = {
    endDate?: string;
    auctionClosed?: boolean;
};

export default function AuctionCardCountdown({
    endDate,
    auctionClosed,
}: Props) {

    const [text, setText] = useState("");
    const [icon, setIcon] =
useState("🏛");

    useEffect(() => {

        function update() {

            if (!endDate || auctionClosed) {
                setText("Encerrado");
                return;
            }

            const diff =
                new Date(endDate).getTime() -
                Date.now();

            if (diff <= 0) {
                setText("Encerrado");
                return;
            }

            const days =
                Math.floor(diff / 86400000);

            const hours =
                Math.floor((diff % 86400000) / 3600000);

            const minutes =
                Math.floor((diff % 3600000) / 60000);

            if (days > 0) {
                setText(`${days}d`);
                return;
            }

            if (hours > 0) {
                setText(`${hours}h ${minutes}m`);
                return;
            }

            setText(`${minutes}m`);

            if (diff <= 0) {

    setIcon("🏁");
    setText("Encerrado");
    return;

}

if (diff <= 60000) {

    setIcon("⚡");

}

else if (diff <= 600000) {

    setIcon("🔥");

}

else {

    setIcon("🏛");

}
        }

        update();

        const interval =
            setInterval(update, 1000);

        return () =>
            clearInterval(interval);

    }, [endDate, auctionClosed]);

    const diff =
        endDate
            ? new Date(endDate).getTime() - Date.now()
            : 0;

    const lastMinute =
        diff > 0 &&
        diff <= 60000;

    const endingSoon =
        diff > 60000 &&
        diff <= 600000;

    let color = "#666";

    if (lastMinute)
        color = "#d32f2f";

    else if (endingSoon)
        color = "#ef6c00";

    return (

<span
style={{
    color,
    fontWeight:700,
}}
>

{icon} {text}

</span>

);

}