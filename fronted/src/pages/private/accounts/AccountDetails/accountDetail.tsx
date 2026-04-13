import { useNavigate, useParams } from "react-router-dom";
import { useAccounts } from "../../../../features/accounts/hooks";
import { useTransactions } from "../../../../features/transactions/hooks";
import LoadingScreen from "../../../../shared/components/LoadingScreen/LoadingScreen";
import TransactionItem from "../../../../features/transactions/components/TransactionItem";
import './AccountDetails.css'
import { useEffect, useState } from "react";
import ModalPortal from "../../../../shared/components/ModalPortal/ModalPortal";
import { useTransfers } from "../../../../features/transfers/hooks";
import type { Transaction } from "../../../../features/transactions/types";
import { format } from "date-fns";
import AccountCard from "../../../../features/accounts/components/accountCard/accountCard";
import TransferForm from "../../../../features/transfers/components/TransferForm/TransferForm";
import { getIcon } from "../../../../shared/utils/GetIcon";
import AccountForm from "../../../../features/accounts/components/accountForm/accountForm";
import InfoModal from "../../../../shared/components/InfoModal/InfoModal";

export function AccountDetail() {
    const { id } = useParams();
    const { account, error, loading, saveAccount, deleteAccount } = useAccounts(id);
    let { transactions, loading: txLoading } = useTransactions({ accountId: id });
    const { transactions: trans, loading: tx2Loading } = useTransactions({ relatedAccountId: id });
    const { createTransfer } = useTransfers()
    const navigate = useNavigate()

    transactions = [...transactions, ...trans]

    // Función rápida para agrupar

    let groupedTransactions = transactions.reduce((groups, tx) => {
        const date = tx.date; // YYYY-MM-DD
        if (!groups[date]) groups[date] = [];
        groups[date].push(tx);
        return groups;
    }, {} as Record<string, Transaction[]>);


    const [showModal, setShowModal] = useState(false)
    const [editModal, setEditModal] = useState(false)
    const [errorTrashModal, setErrorTrashModal] = useState(false)
    const [info, setInfo] = useState(false)

    const { error: errorTrash, isSuccess } = deleteAccount;

    useEffect(() => {
        if (errorTrash) {
            setErrorTrashModal(true)
        }
    }, [errorTrash])

    useEffect(() => {
        if (isSuccess) {
            setInfo(true)
            setTimeout(() => {
                navigate("/accounts")
            }, 2000)
        }
    }, [isSuccess])

    if (loading || tx2Loading || txLoading) return <LoadingScreen />;
    if (!account || error) return <div className="error-view">Hubo un error al cargar la cuenta.</div>;

    const isCredit = account.type === "CREDIT";

    return (
        <div className="page-container animate-fade-in">

            <div className="detail-layout">
                {/* COLUMNA IZQUIERDA: Info de Cuenta */}
                <aside className="detail-sidebar">
                    <AccountCard account={account} />

                    <div className="card action-card mt-6">
                        <h3>Acciones Rápidas</h3>
                        <div className="action-buttons">
                            <button onClick={() => setShowModal(true)} className="btn-primary w-full">
                                {isCredit ? "Pagar Tarjeta" : "Transferir Dinero"}
                            </button>
                            {/* <button className="btn-outline w-full">Descargar Reporte</button> */}
                            <button className="btn-outline edit-button" onClick={() => setEditModal(true)} > {getIcon("edit-2")} Editar cuenta </button>
                            <button className="btn-outline trash-button" onClick={() => deleteAccount.mutate(account.id)} >Eliminar cuenta</button>
                        </div>
                    </div>
                </aside>
                {/* COLUMNA DERECHA: Movimientos */}
                <main className="detail-main">
                    <section className="card">
                        <div className="section-header">
                            <h2>Últimos Movimientos</h2>
                            <span className="badge">{transactions?.length || 0} Total</span>
                        </div>

                        <div className="transactions-list">
                            {txLoading ? (
                                <p>Cargando movimientos...</p>
                            ) : transactions && transactions.length > 0 ? (

                                Object.entries(groupedTransactions).sort(([dateA], [dateB]) => (new Date(dateB).getTime()) - (new Date(dateA).getTime())).map(([date, txs]) => (
                                    <div key={date} className="tx-group">
                                        <h4 className="tx-date-header">{format(date, 'dd/MM/yyyy')}</h4>
                                        {txs.map(tx => (
                                            <TransactionItem
                                                key={tx.id}
                                                transaction={tx}
                                                currentAccountId={account.id}
                                            />
                                        ))}
                                    </div>
                                ))


                            )
                                : (
                                    <div className="empty-tx">No hay movimientos en esta cuenta.</div>
                                )}
                        </div>
                    </section>
                </main>
            </div>

            {/* Modales */}
            <ModalPortal isOpen={editModal} onClose={() => setEditModal(false)}>
                <AccountForm fieldsHidden={{ "type": true }} fieldsDisabled={{ "balance": true }} account={account} isEdit mutation={saveAccount} ></AccountForm>
            </ModalPortal>

            <ModalPortal isOpen={showModal} onClose={() => setShowModal(false)} >
                <TransferForm account={account} mutation={createTransfer} ></TransferForm>
            </ModalPortal>

            <InfoModal isOpen={errorTrashModal} onClose={() => setErrorTrashModal(false)} type="error" title="Hubo un error al eliminar la cuenta" message={errorTrash?.message} ></InfoModal>
            <InfoModal isOpen={info} onClose={() => setInfo(false)} type="success" title="Cuenta Eliminada exitosamente" message="Se redirigira a la vista de cuentas." ></InfoModal>

        </div >
    );
}