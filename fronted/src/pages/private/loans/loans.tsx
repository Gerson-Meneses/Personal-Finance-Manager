import { useLoans } from "../../../features/loans/hooks"
import LoanForm from "../../../features/loans/components/loanForm"
import LoanCard from "../../../features/loans/components/loanCards/loanCard"
import { useState } from "react"
import type { Loan } from "../../../features/loans/types"

export default function LoansPage() {

    const [showForm, setShorForm] = useState<boolean>(false)
    const [viewLoan, setViewLoan] = useState<boolean>(true)

    const {
        loans,
        loading,
        createLoan
    } = useLoans()

    const byLenders = loans.reduce((lenders: { [key: string]: Loan[] }, loan) => {
        if (lenders[loan.lender]?.length > 0) {
            lenders[loan.lender].push(loan)
        } else {
            lenders[loan.lender] = [loan]
        }
        return lenders
    }, {})

    const lenders = Object.keys(byLenders)

    console.log(lenders)

    if (loading) return <p>Cargando...</p>

    return (

        <div>

            <h2>Préstamos</h2>
            <button onClick={() => setShorForm(!showForm)} >Crear Prestamo</button>
            {showForm && <LoanForm lenders={[...lenders]} onSubmit={createLoan} />}

            <select name="viewForms" id="viewForms"
                onChange={(e) => { console.log(viewLoan, Number(e.target.value)), setViewLoan(!!Number(e.target.value)) }}
            >
                <option value={1}>Por Prestamo</option>
                <option value={0}>Por Deudor</option>
            </select>
            <hr />
            {viewLoan && loans.map((loan) => (

                <LoanCard
                    key={loan.id}
                    loan={loan}
                ></LoanCard>

            ))}
            {!viewLoan && (<>Pan</>)}
        </div>
    )
}