import { Link } from "react-router-dom";
import { NotificationBell } from "../../socket/notifications/NotificationBell";
import {
    Search,
    House,
    Gavel,
    MessageCircle,
} from "lucide-react";
type HeaderActionsProps = {
    unreadCount: number;

    onHomeClick: (e: React.MouseEvent) => void;

    iconButtonClassName: string;
    badgeClassName: string;
};

export default function HeaderActions({
    unreadCount,
    onHomeClick,
    iconButtonClassName,
    badgeClassName,
}: HeaderActionsProps) {
    return (
        <>
        <Link
    to="/search"
    className={iconButtonClassName}
>
    <Search size={18} />
</Link>

<Link
    to="/"
    onClick={onHomeClick}
    className={iconButtonClassName}
>
    <House size={18} />
</Link>

<Link
    to="/auctions"
    className={iconButtonClassName}
>
    <Gavel size={18} />
</Link>

            <Link
                to="/inbox"
                className={iconButtonClassName}
            >
                        <MessageCircle size={17}/>

                {unreadCount > 0 && (
                    <span className={badgeClassName}>
                        {unreadCount}
                    </span>
                )}
            </Link>

            <Link
                to="/notifications"
                className={iconButtonClassName}
            >
                <NotificationBell />
            </Link>
        </>
    );
}