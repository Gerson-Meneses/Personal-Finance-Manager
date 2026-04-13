import type { Transaction } from "../types";
import './styles.css'
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { getIcon } from "../../../shared/utils/GetIcon";
import { useState } from "react";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import TransactionForm from "./TransactionForm/TransactionForm";
import { useTransactions } from "../hooks";
import dayjs from 'dayjs'
import 'dayjs/locale/es' // Importar el idioma español
dayjs.locale('es') // Usarlo de forma global

interface Props {
  transaction: Transaction;
  currentAccountId?: string; // Para saber si es entrante o saliente en la vista de cuenta
  hideFields?: {
    account?: boolean;
    category?: boolean;
    date?: boolean;
    description?: boolean;
  };
}

export default function TransactionItem({ transaction, currentAccountId, hideFields }: Props) {
  const {
    name, amount, type, date, category, account, description, relatedAccount
  } = transaction;

  if (!transaction) return <>Error</>

  let fromAccount = account
  let toAccount = relatedAccount

  // Lógica de dirección para transferencias
  const isOutgoingTransfer = type === "TRANSFER" && fromAccount?.id === currentAccountId;
  const isIncomingTransfer = type === "TRANSFER" && toAccount?.id === currentAccountId;

  // El color y el signo dependen del tipo y de la dirección
  const isNegative = type === "EXPENSE" || isOutgoingTransfer || type === "CREDIT_PAYMENT";

  const { saveTransaction, deleteTransaction } = useTransactions()

  const [modalEditOpen, setModalEditOpen] = useState(false);

  return (
    <div className={`tx-item-card animate-fade-in ${type.toLowerCase()}`} style={{ borderLeft: `3px solid ${category.color}` }}>
      <div className="tx-main-content">
        {/* ICONO CON COLOR DINÁMICO */}
        <div
          className="tx-icon-container"
          style={{
            backgroundColor: `${category.color}20`,
            color: category.color
          }}
        >
          {category.icon && getIcon(category.icon)}
        </div>

        <div className="tx-details-wrapper">
          <div className="tx-top-row">
            <div className="tx-name-group">
              <span className="tx-name">{name}</span>
              {/* Badge de transferencia entrante/saliente */}
              {type === "TRANSFER" && currentAccountId && (
                <span className={`tx-direction-badge ${isIncomingTransfer ? 'in' : 'out'}`}>
                  {isIncomingTransfer ? 'Recibido' : 'Enviado'}
                </span>
              )}
            </div>

            <span className="edit-button" onClick={() => setModalEditOpen(true)}>
              {getIcon("edit-2")}
            </span>
            <ModalPortal isOpen={modalEditOpen} onClose={() => setModalEditOpen(false)}>
              <TransactionForm transaction={transaction} isEdit mutation={saveTransaction} ></TransactionForm>
            </ModalPortal>

            <span className="delete-button" onClick={() => deleteTransaction.mutate(transaction.id)}>
              {getIcon("trash2")}
            </span>
            <span className={`tx-amount amount-font ${isNegative ? "text-danger" : "text-success"}`}>
              {isNegative ? "-" : "+"} {formatCurrency(amount)}
            </span>
          </div>

          <div className="tx-bottom-row">
            <div className="tx-meta-group">
              {!hideFields?.date && <span className="tx-date">{dayjs(date).format("dddd D")}</span>}

              {!hideFields?.category && (
                <>
                  <span className="tx-divider" >•</span>
                  <span className="tx-category-name tx-account-badge" style={{ borderColor: category.color }}>{category.name}</span>
                </>
              )}

              {!hideFields?.account && account && (
                <>
                  <span className="tx-divider">•</span>
                  <span className="tx-account-badge" style={{ borderColor: account.color }}>
                    {account.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {!hideFields?.description && description && (
            <p className="tx-description text-muted">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}