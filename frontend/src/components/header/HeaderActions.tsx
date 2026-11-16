
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
                aria-label="Pesquisar"
            >
                <Search size={23} strokeWidth={2} />
            </Link>

            <Link
                to="/"
                onClick={onHomeClick}
                className={iconButtonClassName}
                aria-label="Página inicial"
            >
                <House size={23} strokeWidth={2} />
            </Link>

            <Link
                to="/auctions"
                className={iconButtonClassName}
                aria-label="Leilões"
            >
                <Gavel size={23} strokeWidth={2} />
            </Link>

            <Link
                to="/inbox"
                className={iconButtonClassName}
                aria-label="Mensagens"
            >
                <MessageCircle size={23} strokeWidth={2} />

                {unreadCount > 0 && (
                    <span className={badgeClassName}>
                        {unreadCount}
                    </span>
                )}
            </Link>

            <Link
                to="/notifications"
                className={iconButtonClassName}
                aria-label="Notificações"
            >
                <NotificationBell />
            </Link>
        </>
    );
}
