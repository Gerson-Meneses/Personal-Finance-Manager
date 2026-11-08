import InfoModal from "../../../shared/components/InfoModal/InfoModal";

interface Props {
  isOpen: boolean;
  /** "No, gracias" o cerrar: no se abre el formulario de nuevo */
  onClose: () => void;
  /** "Sí, agregar otra": el formulario vuelve a abrirse con los mismos datos base */
  onAddAnother: () => void;
}

/* Pregunta que aparece tras registrar un movimiento. El aviso de éxito ya
   lo muestra el toast; esto solo ofrece seguir registrando. */
export function AddAnotherTransactionPrompt({ isOpen, onClose, onAddAnother }: Props) {
  return (
    <InfoModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onAddAnother}
      type="info"
      title="¿Desea agregar otra transacción?"
      message="Puede registrar otro movimiento sin volver a abrir el formulario."
      confirmText="Sí, agregar otra"
      cancelText="No, gracias"
    />
  );
}
