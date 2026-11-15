import type { Loan } from "../../types";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { getIcon } from "../../../../shared/utils/GetIcon";
import dayjs from "dayjs";
import { useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import ModalPortal from "../../../../shared/components/ModalPortal/ModalPortal";
import { CreateLoanPaymentForm } from "../../../LoanPayments/PayLoanForm/PayLoanForm";
import type { LoanPayment } from "../../../LoanPayments/types";
import { TruncateText } from "../../../../shared/components/TruncateText/TruncateText";
import InfoModal from "../../../../shared/components/InfoModal/InfoModal";
import { useLoanPayments } from "../../hooks";
import { EditMovementModal } from "../EditMovementModal/EditMovementModal";
import { useToast } from "../../../../shared/Hooks/useToast";

interface LoanPaymentsListProps {
    loan?: Loan;
    payments: LoanPayment[];
    isGiven: boolean; // Para saber si sumas o restas dinero al pagar
}

export const LoanPaymentsList = ({ loan, payments, isGiven }: LoanPaymentsListProps) => {
    const [showModal, setShowModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState<LoanPayment | null>(null);
    const [reversingPayment, setReversingPayment] = useState<LoanPayment | null>(null);
    const { updateMovement, reverseMovement } = useLoanPayments();
    const toast = useToast();
    return (
        <div className="loan-payments-section">

            <h4 className="loan-payments__title section-header">Historial de Pagos ({payments.length})
                <button
                    className="btn-circle tooltip-left"
                    data-tooltip="Agregar Pago"
                    onClick={() => setShowModal(true)}
                    aria-label="Agregar pago"
                >
                    {getIcon("plus", { size: 16, color: "#dad305" })}
                </button>
            </h4>

            {payments.length === 0 ? (
                <p className="loan-payments__empty">No se han registrado pagos aún.</p>
            ) : (
                <div className="loan-payments__list">
                    {payments.map((payment) => {
                        // El signo depende de si prestaste (recibes dinero de vuelta +) o viceversa
                        const isPositivePayment = isGiven;

                        return (
                            <div key={payment.id} className="payment-row-item">
                                <div className="payment-row-item__left">
                                    <div className="payment-row-item__icon">
                                        {getIcon("CheckCircle", { size: 14, color: "#4CAF50" })}
                                    </div>
                                    <div className="payment-row-item__info">
                                        <span className="payment-row-item__name">
                                            <TruncateText text={payment.description || "Abono / Pago de cuota"} maxLength={90} classname="loan-card__description" />
                                        </span>
                                        <div className="payment-row-item__meta">
                                            <span className="payment-row-item__date">
                                                {dayjs(payment.date).format("dddd D · MMM YYYY")}
                                            </span>
                                            {payment.account?.name && (
                                                <>
                                                    <span className="payment-row-item__divider">•</span>
                                                    <span className="payment-row-item__account" style={{ borderColor: payment.account.color }}>
                                                        {payment.account.name.toUpperCase()}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <span className={`payment-row-item__amount ${isPositivePayment ? "text-success" : "text-danger"}`}>
                                    {isPositivePayment ? "+" : "-"} {formatCurrency(payment.amount)}
                                </span>
                                {loan && (
                                    <div className="payment-row-item__actions">
                                        <button type="button" className="btn-ghost" title="Editar pago" onClick={() => setEditingPayment(payment)}>
                                            <Pencil size={13} />
                                        </button>
                                        <button type="button" className="btn-ghost danger" title="Reversar pago" onClick={() => setReversingPayment(payment)}>
                                            <RotateCcw size={13} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {loan && (
                <ModalPortal isOpen={showModal} onClose={() => setShowModal(false)}>
                    <CreateLoanPaymentForm loanId={loan.id} loan={loan} onClose={() => setShowModal(false)} />
                </ModalPortal>
            )}

            <ModalPortal isOpen={!!editingPayment} onClose={() => setEditingPayment(null)}>
                {editingPayment && loan && (
                    <EditMovementModal
                        payment={editingPayment}
                        isPending={updateMovement.isPending}
                        onSubmit={async ({ date, note }) => {
                            try {
                                await updateMovement.mutateAsync({
                                    loanId: loan.id,
                                    movementId: editingPayment.id,
                                    data: { date, note },
                                });
                                toast.success("Pago actualizado");
                                setEditingPayment(null);
                            } catch (error) {
                                toast.error(error instanceof Error ? error.message : "No se pudo actualizar el pago");
                            }
                        }}
                        onClose={() => setEditingPayment(null)}
                    />
                )}
            </ModalPortal>

            <InfoModal
                isOpen={!!reversingPayment}
                onClose={() => setReversingPayment(null)}
                onConfirm={() => {
                    if (!reversingPayment || !loan) return;
                    reverseMovement.mutate(
                        {
                            loanId: loan.id,
                            movementId: reversingPayment.id,
                            data: { reason: "Pago reversado por el usuario" },
                        },
                        {
                            onSuccess: () => {
                                toast.success("Pago reversado");
                                setReversingPayment(null);
                            },
                            onError: (error) => toast.error(error.message || "No se pudo reversar el pago"),
                        }
                    );
                }}
                type="error"
                title="Reversar pago"
                message="Se creará un movimiento de ajuste y se restaurará la deuda. El pago original no se borrará."
                confirmText={reverseMovement.isPending ? "Reversando..." : "Reversar pago"}
                cancelText="Cancelar"
                confirmDisabled={reverseMovement.isPending}
            />
        </div>
    );
};