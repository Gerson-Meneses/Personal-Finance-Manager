import { useNavigate, useParams } from "react-router-dom";
import { useAccounts } from "../../../../features/accounts/hooks";
import { useTransactions } from "../../../../features/transactions/hooks";
import LoadingScreen from "../../../../shared/components/LoadingScreen/LoadingScreen";
import TransactionItem from "../../../../features/transactions/components/TransactionItem";
import TransactionForm from "../../../../features/transactions/components/TransactionForm/TransactionForm";
import { AddAnotherTransactionPrompt } from "../../../../features/transactions/components/AddAnotherTransactionPrompt";
import './AccountDetails.css'
import { useState } from "react";
import ModalPortal from "../../../../shared/components/ModalPortal/ModalPortal";
import { useTransfers } from "../../../../features/transfers/hooks";
import type { Transaction } from "../../../../features/transactions/types";
import AccountCard from "../../../../features/accounts/components/accountCard/accountCard";
import TransferForm from "../../../../features/transfers/components/TransferForm/TransferForm";
import { getIcon } from "../../../../shared/utils/GetIcon";
import AccountForm from "../../../../features/accounts/components/accountForm/accountForm";
import InfoModal from "../../../../shared/components/InfoModal/InfoModal";
import PaymentCreditCardForm from "../../../../features/CreditPayment/Components/CreditPaymentForm";
import NotFoundView from "../../../../shared/components/NotFoundView/NotFoundView";
import { ListHistory } from "../../../../shared/components/ListHistory/ListHistory";
import { useToast } from "../../../../shared/Hooks/useToast";

export function AccountDetail() {
    const { id } = useParams();
    const { account, error, loading, saveAccount, deleteAccount } = useAccounts(id);
    const { transactions: accountTx, loading: txLoading, saveTransaction } = useTransactions({ accountId: id });
    const { transactions: trans, loading: tx2Loading } = useTransactions({ relatedAccountId: id });
    const { createTransfer } = useTransfers()
    const navigate = useNavigate()
    const toast = useToast()

    const transactions = [...accountTx, ...trans]

    const [showModal, setShowModal] = useState(false)
    const [editModal, setEditModal] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [txModal, setTxModal] = useState(false)
    const [askAnother, setAskAnother] = useState(false)

    if (loading || tx2Loading || txLoading) return <LoadingScreen />;
    if (!account || error) return <NotFoundView></NotFoundView>;

    const isCredit = account.type === "CREDIT";

    const handleDeleteAccount = () => {
        deleteAccount.mutate(account.id, {
            onSuccess: () => {
                toast.success("Cuenta eliminada");
                navigate("/accounts");
            },
            onError: (err) => {
                setConfirmDelete(false);
                toast.error(err.message || "No se pudo eliminar la cuenta");
            },
        });
    };

    return (
        <div className="page-container account-detail animate-fade-in">

            <div className="detail-layout">
                {/* COLUMNA IZQUIERDA: Info de Cuenta */}
                <aside className="default-column">
                    <AccountCard account={account} />

                    <div className="card action-card mt-6">
                        <h3>• Acciones Rápidas</h3>
                        <div className="action-buttons">
                            <button
                                onClick={() => {
                                    saveTransaction.reset()
                                    setTxModal(true)
                                }}
                                className="btn-primary"
                            >
                                Nueva transacción
                            </button>
                            <button onClick={() => setShowModal(true)} className="btn-primary ">
                                {isCredit ? "Pagar Tarjeta" : "Transferir Dinero"}
                            </button>
                            <button className="btn-icon btn-icon-edit" onClick={() => setEditModal(true)} > {getIcon("edit-2")} Editar cuenta </button>
                            <button className="btn-icon btn-icon-delete" onClick={() => setConfirmDelete(true)} >Eliminar cuenta</button>
                        </div>
                    </div>
                </aside>
                {/* COLUMNA DERECHA: Movimientos */}
                <section className="detail-main">
                    <div className="card">
                        <ListHistory<Transaction>
                            title="Últimos Movimientos"
                            items={transactions}
                            subtitle={`${transactions?.length || 0} Total(es)`}
                            emptyMessage="No hay movimientos en esta cuenta."
                            groupByDate
                            renderItem={(item) => (
                                <TransactionItem
                                    transaction={item}
                                />
                            )}
                        />
                    </div>
                </section>
            </div>

            {/* Modales */}
            <ModalPortal isOpen={editModal} onClose={() => setEditModal(false)}>
                <AccountForm
                    fieldsHidden={{ "type": true, "delete": true }}
                    account={account}
                    isEdit
                    mutation={saveAccount}
                    onSuccess={() => setEditModal(false)}
                    onClose={() => setEditModal(false)}
                />
            </ModalPortal>

            {/* Modal Dinámico: transferencia o pago de tarjeta */}
            <ModalPortal isOpen={showModal} onClose={() => setShowModal(false)}>
                {isCredit ? (
                    <PaymentCreditCardForm
                        cardId={account.id}
                        cardName={account.name}
                        onSuccess={() => setShowModal(false)}
                        onClose={() => setShowModal(false)}
                    />
                ) : (
                    <TransferForm
                        account={account}
                        mutation={createTransfer}
                        onSuccess={() => setShowModal(false)}
                        onClose={() => setShowModal(false)}
                    />
                )}
            </ModalPortal>

            {/* Modal nueva transacción — cuenta preseleccionada */}
            <ModalPortal isOpen={txModal} onClose={() => setTxModal(false)}>
                <TransactionForm
                    mutation={saveTransaction}
                    defaultAccountId={account.id}
                    onClose={() => setTxModal(false)}
                    onSuccess={() => {
                        setTxModal(false)
                        setAskAnother(true)
                    }}
                />
            </ModalPortal>

            <AddAnotherTransactionPrompt
                isOpen={askAnother}
                onClose={() => setAskAnother(false)}
                onAddAnother={() => {
                    setAskAnother(false)
                    saveTransaction.reset()
                    setTxModal(true)
                }}
            />

            {/* Confirmación destructiva: eliminar la cuenta */}
            <InfoModal
                isOpen={confirmDelete}
                onClose={() => { if (!deleteAccount.isPending) setConfirmDelete(false) }}
                onConfirm={handleDeleteAccount}
                type="error"
                title="Eliminar cuenta"
                message={`¿Eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`}
                confirmText={deleteAccount.isPending ? "Eliminando…" : "Eliminar"}
                cancelText="Cancelar"
                confirmDisabled={deleteAccount.isPending}
            />

        </div >
    );
}
