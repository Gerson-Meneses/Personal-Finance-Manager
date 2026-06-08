import type { Transaction } from "../types";
import './styles.css'
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { getIcon } from "../../../shared/utils/GetIcon";
import { useState } from "react";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import TransactionForm from "./TransactionForm/TransactionForm";
import { useTransactions } from "../hooks";
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { TruncateText } from "../../../shared/components/TruncateText/TruncateText";
import { HighlightText } from "../../../shared/components/Highlighttext/Highlighttext";

dayjs.locale('es')

interface Props {
    transaction: Transaction;
    currentAccountId?: string;
    search?: string; // término de búsqueda para resaltar coincidencias
    hideFields?: {
        account?: boolean;
        category?: boolean;
        date?: boolean;
        description?: boolean;
    };
}

export default function TransactionItem({ transaction, currentAccountId, search = "", hideFields }: Props) {
    const {
        name, amount, type, date, category, account, description, relatedAccount
    } = transaction;

    if (!transaction) return <>Error</>

    let fromAccount = account
    let toAccount = relatedAccount

    const isOutgoingTransfer = type === "TRANSFER" && fromAccount?.id === currentAccountId;
    const isIncomingTransfer = type === "TRANSFER" && toAccount?.id === currentAccountId;
    const isNegative = type === "EXPENSE" || isOutgoingTransfer || type === "CREDIT_PAYMENT";

    const { saveTransaction } = useTransactions()
    const [modalEditOpen, setModalEditOpen] = useState(false);

    const dateFormatted = dayjs(date).format("dddd D");

    return (
        <>
            <div
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setModalEditOpen(true) }}
                className={`tx-item-card animate-fade-in ${type.toLowerCase()}`}
                style={{ borderLeft: `3px solid ${category?.color}` }}
            >
                <div className="tx-main-content">
                    <div
                        className="tx-icon-container"
                        style={{
                            backgroundColor: `${category?.color}20`,
                            color: category?.color
                        }}
                    >
                        {category?.icon && getIcon(category.icon)}
                    </div>

                    <div className="tx-details-wrapper">
                        <div className="tx-top-row">
                            <div className="tx-name-group">
                                <HighlightText
                                    text={name}
                                    term={search}
                                    className="tx-name"
                                />
                                {type === "TRANSFER" && currentAccountId && (
                                    <span className={`tx-direction-badge ${isIncomingTransfer ? 'in' : 'out'}`}>
                                        {isIncomingTransfer ? 'Recibido' : 'Enviado'}
                                    </span>
                                )}
                            </div>

                            <span className={`tx-amount amount-font ${isNegative ? "text-danger" : "text-success"}`}>
                                {isNegative ? "-" : "+"} {formatCurrency(amount)}
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
                                            // style no se puede pasar, lo dejamos en el wrapper
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

            <ModalPortal isOpen={modalEditOpen} onClose={() => setModalEditOpen(false)}>
                <TransactionForm
                    transaction={transaction}
                    isEdit
                    mutation={saveTransaction}
                    onClose={() => setModalEditOpen(false)}
                />
            </ModalPortal>
        </>
    );
}