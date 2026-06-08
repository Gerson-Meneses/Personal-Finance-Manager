import type { Loan } from "../../types";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { getIcon } from "../../../../shared/utils/GetIcon";
import dayjs from "dayjs";
import { useState } from "react";
import ModalPortal from "../../../../shared/components/ModalPortal/ModalPortal";
import { CreateLoanPaymentForm } from "../../../LoanPayments/PayLoanForm/PayLoanForm";
import type { LoanPayment } from "../../../LoanPayments/types";
import { TruncateText } from "../../../../shared/components/TruncateText/TruncateText";
import Tippy from "@tippyjs/react";

interface LoanPaymentsListProps {
    loan?: Loan;
    payments: LoanPayment[];
    isGiven: boolean; // Para saber si sumas o restas dinero al pagar
}

export const LoanPaymentsList = ({ loan, payments, isGiven }: LoanPaymentsListProps) => {
    const [showModal, setShowModal] = useState(false);
    return (
        <div className="loan-payments-section">

            <h4 className="loan-payments__title section-header">Historial de Pagos ({payments.length})
                <Tippy placement="left" content={<span className="tooltip" >Agregar Pago</span>}>
                    <button className="btn-circle" onClick={() => setShowModal(true)}>
                        {getIcon("plus", { size: 16, color: "#dad305" })}
                    </button>
                </Tippy>
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
        </div>
    );
};