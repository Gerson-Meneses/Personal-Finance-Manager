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
import AccountCard from "../../../../features/accounts/components/accountCard/accountCard";
import TransferForm from "../../../../features/transfers/components/TransferForm/TransferForm";
import { getIcon } from "../../../../shared/utils/GetIcon";
import AccountForm from "../../../../features/accounts/components/accountForm/accountForm";
import InfoModal from "../../../../shared/components/InfoModal/InfoModal";
import PaymentCreditCardForm from "../../../../features/CreditPayment/Components/CreditPaymentForm";
import NotFoundView from "../../../../shared/components/NotFoundView/NotFoundView";
import { ListHistory } from "../../../../shared/components/ListHistory/ListHistory";

export function AccountDetail() {
    const { id } = useParams();
    const { account, error, loading, saveAccount, deleteAccount } = useAccounts(id);
    let { transactions, loading: txLoading } = useTransactions({ accountId: id });
    const { transactions: trans, loading: tx2Loading } = useTransactions({ relatedAccountId: id });
    const { createTransfer } = useTransfers()
    const navigate = useNavigate()

    transactions = [...transactions, ...trans]

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
    if (!account || error) return <NotFoundView></NotFoundView>;

    const isCredit = account.type === "CREDIT";

    return (
        <div className="page-container animate-fade-in">

            <div className="detail-layout">
                {/* COLUMNA IZQUIERDA: Info de Cuenta */}
                <aside className="default-column">
                    <AccountCard account={account} />

                    <div className="card action-card mt-6">
                        <h3>• Acciones Rápidas</h3>
                        <div className="action-buttons">
                            <button onClick={() => setShowModal(true)} className="btn-primary ">
                                {isCredit ? "Pagar Tarjeta" : "Transferir Dinero"}
                            </button>
                            {/* <button className="btn-outline w-full">Descargar Reporte</button> */}
                            <button className="btn-icon btn-icon-edit" onClick={() => setEditModal(true)} > {getIcon("edit-2")} Editar cuenta </button>
                            <button className="btn-icon btn-icon-delete" onClick={() => deleteAccount.mutate(account.id)} >Eliminar cuenta</button>
                        </div>
                    </div>
                </aside>
                {/* COLUMNA DERECHA: Movimientos */}
                <main className="detail-main">
                    <section className="card">
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
                      
                    </section>
                </main>
            </div>

            {/* Modales */}
            <ModalPortal isOpen={editModal} onClose={() => setEditModal(false)}>
                <AccountForm fieldsHidden={{ "type": true, "delete": true }} account={account} isEdit mutation={saveAccount} ></AccountForm>
            </ModalPortal>

            {/* Modal Dinámico */}
            <ModalPortal isOpen={showModal} onClose={() => setShowModal(false)}>
                {isCredit ? (
                    <PaymentCreditCardForm
                        cardId={account.id}
                        cardName={account.name}
                        onSuccess={() => setShowModal(false)} // Opcional: cerrar al terminar
                    />
                ) : (
                    <TransferForm
                        account={account}
                        mutation={createTransfer}
                    />
                )}
            </ModalPortal>

            <InfoModal isOpen={errorTrashModal} onClose={() => setErrorTrashModal(false)} type="error" title="Hubo un error al eliminar la cuenta" message={errorTrash?.message} ></InfoModal>
            <InfoModal isOpen={info} onClose={() => setInfo(false)} type="success" title="Cuenta Eliminada exitosamente" message="Se redirigira a la vista de cuentas." ></InfoModal>

        </div >
    );
}