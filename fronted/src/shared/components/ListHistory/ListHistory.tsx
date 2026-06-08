import React from "react";
import { getIcon } from "../../utils/GetIcon";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "./ListHistory.css";

dayjs.locale("es");

interface ItemWithDate {
    date?: string | Date; // Soportamos string o instancias de Date
}

interface ListHistoryProps<T extends ItemWithDate> {
    title: string;
    icon?: string;
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    subtitle?: string;
    emptyMessage?: string;
    groupByDate?: boolean;
}

export const ListHistory = <T extends ItemWithDate>({
    title,
    icon,
    items,
    renderItem,
    subtitle,
    emptyMessage = "No se encontraron elementos para mostrar.",
    groupByDate,
}: ListHistoryProps<T>) => {

    // FUNCIÓN DE FORMATEO INTELIGENTE SOLICITADA
    const formatGroupDate = (dateStr: string) => {
        const targetDate = dayjs(dateStr);
        const now = dayjs();

        if (!targetDate.isValid()) return dateStr;

        // 1. Si es de un año diferente al actual -> "jueves 4 de jun. 2025"
        if (targetDate.year() !== now.year()) {
            return targetDate.format("dddd D [de] MMMM YYYY");
        }

        // 2. Si es del mismo año pero de un mes diferente -> "jueves 4 de jun."
        if (targetDate.month() !== now.month()) {
            return targetDate.format("dddd D [de] MMMM");
        }

        // 3. Si es del mismo mes y año actual -> "jueves 4"
        return targetDate.format("dddd D");
    };

    // RENDERIZADO AGRUPADO POR FECHA
    if (groupByDate) {
        const itemsWithDate = items.filter(
            (item): item is T & { date: string | Date } => !!item.date
        );

        // Agrupamos usando YYYY-MM-DD como key pura para evitar desfases de ordenamiento
        const groupedByDate = itemsWithDate.reduce((acc, item) => {
            const dateKey = dayjs(item.date).format("YYYY-MM-DD");
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].unshift(item);
            return acc;
        }, {} as Record<string, T[]>);

        if (items.length === 0) {
            return (
                <div className="list-history-container">
                    <div className="list-history__header">
                        <h2 className="list-history__title">
                            {title} {icon && getIcon(icon)}
                        </h2>
                        {subtitle && <p className="list-history__subtitle">{subtitle}</p>}
                    </div>
                    <div className="list-history__empty">
                        {emptyMessage}
                    </div>
                </div>
            );
        }


        return (
            <div className="list-history-container">
                <div className="list-history__header">
                    <h2 className="list-history__title">
                        {title} {icon && getIcon(icon)}
                    </h2>
                    {subtitle && <p className="list-history__subtitle">{subtitle}</p>}
                </div>

                <div className="list-history__timeline">
                    {
                        Object.entries(groupedByDate).map(([date, groupItems]) => (
                            <div key={date} className="list-history__date-group">
                                {/* Cabecera formateada con tu regla de negocio */}
                                <h3 className="list-history__date-label">
                                    • {formatGroupDate(date)}
                                </h3>

                                <div className="list-history__items-wrapper">
                                    {groupItems.map((item, index) => (
                                        <div key={index} className="list-history__item-row">
                                            {renderItem(item)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        );
    }

    // RENDERIZADO POR DEFECTO (LISTA PLANA)
    return (
        <div className="list-history-container">
            <div className="list-history__header">
                <h2 className="list-history__title">
                    {title} {icon && getIcon(icon)}
                </h2>
                {subtitle && <p className="list-history__subtitle">{subtitle}</p>}
            </div>

            <div className="list-history__flat-list">
                {
                    items.map((item, index) => (
                        <div key={index} className="list-history__item-row">
                            {renderItem(item)}
                        </div>
                    ))}
            </div>
        </div>
    );
};