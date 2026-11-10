import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { usePaymentNotifications } from "../hooks";
import "./NotificationsBell.css";

export function NotificationsBell() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { notifications, unread, markRead, markAllRead } = usePaymentNotifications();

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return (
        <div className="notif-bell" data-tour="notifications" ref={ref}>
            <button
                type="button"
                className="notif-bell__btn tooltip-left"
                data-tooltip="Notificaciones"
                aria-label="Notificaciones"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
            >
                <Bell size={18} />
                {unread > 0 && <span className="notif-bell__badge">{unread > 9 ? "9+" : unread}</span>}
            </button>

            {open && (
                <div className="notif-panel" role="dialog" aria-label="Notificaciones">
                    <header className="notif-panel__head">
                        <div>
                            <strong>Notificaciones</strong>
                            <span>{unread} sin leer</span>
                        </div>
                        {unread > 0 && (
                            <button
                                type="button"
                                className="notif-panel__action"
                                onClick={() => markAllRead.mutate()}
                            >
                                <CheckCheck size={14} />
                                Marcar todas
                            </button>
                        )}
                    </header>

                    <div className="notif-panel__list">
                        {notifications.length === 0 ? (
                            <p className="notif-panel__empty">No tienes notificaciones.</p>
                        ) : (
                            notifications.slice(0, 6).map((notification) => (
                                <button
                                    key={notification.id}
                                    type="button"
                                    className={`notif-item ${notification.readAt ? "is-read" : ""}`}
                                    onClick={() => {
                                        if (!notification.readAt) markRead.mutate(notification.id);
                                        setOpen(false);
                                        navigate("/recurring");
                                    }}
                                >
                                    <span className="notif-item__dot" />
                                    <span className="notif-item__body">
                                        <strong>{notification.title}</strong>
                                        <span>{notification.message}</span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    <button
                        type="button"
                        className="notif-panel__footer"
                        onClick={() => {
                            setOpen(false);
                            navigate("/recurring");
                        }}
                    >
                        Ver pagos previstos
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
