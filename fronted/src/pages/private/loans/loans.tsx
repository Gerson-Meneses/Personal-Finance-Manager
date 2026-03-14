import { useLoans } from "../../../features/loans/hooks"
import LoanForm from "../../../features/loans/components/loanForm"
import LoanCard from "../../../features/loans/components/loanCards/loanCard"

export default function LoansPage() {

    const {
        loans,
        loading,
        createLoan
    } = useLoans()

    if (loading) return <p>Cargando...</p>

    return (

        <div>

            <h2>Préstamos</h2>

            <LoanForm
                onSubmit={createLoan}
            />

            <hr />
            {loans.map((loan) => (
                <div>
                    <LoanCard
                        key={loan.id}
                        loan={loan}
                    ></LoanCard>
                </div>
            ))}
        </div>
    )
}