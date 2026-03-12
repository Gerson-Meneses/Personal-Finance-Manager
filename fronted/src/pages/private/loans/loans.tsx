import { useLoans } from "../../../features/loans/hooks"
import LoanForm from "../../../features/loans/components/loanForm"
import LoanPaymentForm from "../../../features/loans/components/loanPaymentForm"

export default function LoansPage() {

    const {
        loans,
        loading,
        createLoan,
        payLoan,
        deleteLoan
    } = useLoans()

    if (loading) return <p>Cargando...</p>

    return (

        <div>

            <h2>Préstamos</h2>

            <LoanForm
                onSubmit={createLoan}
            />

            <hr />

            {loans.map(loan => (

                <div
                    key={loan.id}
                    id={loan.id}
                    
                    style={{
                        border: "1px solid #ddd",
                        padding: 10,
                        marginBottom: 10
                    }}
                >

                    <h4>{loan.lender}</h4>

                    <p>
                        Tipo:
                        {loan.type === "GIVEN"
                            ? " Presté"
                            : " Me prestaron"}
                    </p>

                    <p>Monto: {loan.principalAmount}</p>

                    <p>Pendiente: {loan.principalAmount - (loan.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0)}</p>

                    <LoanPaymentForm
                
                        onSubmit={(amount, date, accountId) =>
                            payLoan({
                                id: loan.id,
                                amount,
                                date,
                                accountId
                            })
                        }
                    />

                    <button
                        onClick={() =>
                            deleteLoan(loan.id)
                        }
                    >
                        Eliminar
                    </button>

                </div>

            ))}

        </div>
    )
}