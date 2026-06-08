import type { Loan } from "../../types";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { getIcon } from "../../../../shared/utils/GetIcon";
import { TruncateText } from "../../../../shared/components/TruncateText/TruncateText";

import dayjs from "dayjs";
import "dayjs/locale/es";
import type { LoanPayment } from "../../../LoanPayments/types";
import { HighlightText } from "../../../../shared/components/Highlighttext/Highlighttext";

dayjs.locale("es");

export type LoanHistoryMixedItem = Partial<Loan & LoanPayment>;

interface Props {
    item: LoanHistoryMixedItem;
    search?: string;
    hideFields?: {
        account?: boolean;
        category?: boolean;
        date?: boolean;
        description?: boolean;
    };
    onClick?: () => void;
}

export const LoanHistoryItem = ({ item, search = "", hideFields = { category: true }, onClick }: Props) => {
    const isLoanMode = !!item.lender || !!item.payments;

    const transaction = item.transaction;
    const category = transaction?.category;
    const account = transaction?.account || item.account;

    let isIncome = false;
    if (isLoanMode) {
        isIncome = item.type === "RECEIVED";
    } else {
        isIncome = !(item.type === "RECEIVED");
    }

    const name = transaction?.name || (isLoanMode ? `Préstamo de ${item.lender}` : "Abono a Préstamo");
    const amount = transaction?.amount || item.amount || 0;
    const date = transaction?.date || item.date || dayjs().format("YYYY-MM-DD");
    const description = transaction?.description || item.description || "";
    const dateFormatted = dayjs(date).format("dddd D");

    return (
        <div
            onClick={onClick}
            className={`tx-item-card animate-fade-in loan-history-item ${isLoanMode ? "mode-loan" : "mode-payment"}`}
            style={{ borderLeft: `3px solid ${category?.color || "#3b82f6"}` }}
        >
            <div className="tx-main-content">
                <div
                    className="tx-icon-container"
                    style={{
                        backgroundColor: `${category?.color || "#3b82f6"}20`,
                        color: category?.color || "#3b82f6",
                    }}
                >
                    {category?.icon
                        ? getIcon(category.icon)
                        : getIcon(isLoanMode ? "HandCoins" : "CheckCircle2")
                    }
                </div>

                <div className="tx-details-wrapper">
                    <div className="tx-top-row">
                        <div className="tx-name-group">
                            <HighlightText
                                text={name}
                                term={search}
                                className="tx-name"
                            />
                            <span
                                className={`tx-direction-badge ${isLoanMode ? "badge-main-loan" : "badge-payment-sub"}`}
                                style={{
                                    background: `${transaction?.category?.color ?? "#2bb418"}69`,
                                    color: "#adadad",
                                }}
                            >
                                {isLoanMode ? "Préstamo" : "Abono"}
                            </span>
                            <span className={`loan-card__badge ${item.type === "GIVEN" ? "given" : "received"}`}>
                                {item.type === "GIVEN" ? "Presté" : "Recibí"}
                            </span>
                        </div>

                        <span className={`tx-amount amount-font ${isIncome ? "text-success" : "text-danger"}`}>
                            {isIncome ? "+" : "-"} {formatCurrency(amount)}
                        </span>
                    </div>

                    <div className="tx-bottom-row">
                        <div className="tx-meta-group">
                            {!hideFields?.date && (
                                <HighlightText
                                    text={dateFormatted}
                                    term={search}
                                    className="tx-date"
                                />
                            )}

                            {!hideFields?.category && category?.name && (
                                <>
                                    <span className="tx-divider">•</span>
                                    <HighlightText
                                        text={category.name}
                                        term={search}
                                        className="tx-category-name tx-account-badge"
                                    />
                                </>
                            )}

                            {!hideFields?.account && account && (
                                <>
                                    <span className="tx-divider">•</span>
                                    <HighlightText
                                        text={account.name}
                                        term={search}
                                        className="tx-account-badge"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {!hideFields?.description && description && (
                        search
                            ? <HighlightText text={description} term={search} className="tx-description text-muted" />
                            : <TruncateText text={description} maxLength={60} classname="tx-description text-muted" />
                    )}
                </div>
            </div>
        </div>
    );
};