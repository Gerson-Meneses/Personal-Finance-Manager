import ModalPortal from "../../../shared/components/ModalPortal"
import TransactionForm from "./transactionForm"

export const NewTransactionModal = ({ onClose }: { onClose: () => void }) => {
    return <ModalPortal onClose={onClose} >
        <TransactionForm onClose={onClose} ></TransactionForm>
    </ModalPortal>
}