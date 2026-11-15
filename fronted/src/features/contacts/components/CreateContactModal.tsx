import { useState } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { useContacts } from "../hooks";
import type { Contact } from "../types";

interface Props {
    isOpen: boolean;
    initialName?: string;
    onCreated: (contact: Contact) => void;
    onClose: () => void;
}

export function CreateContactModal({ isOpen, initialName = "", onCreated, onClose }: Props) {
    const { createContact } = useContacts();
    const [name, setName] = useState(initialName);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (trimmed.length < 3) {
            setError("El nombre debe tener al menos 3 caracteres");
            return;
        }

        try {
            const contact = await createContact.mutateAsync({ name: trimmed });
            onCreated(contact);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear el contacto");
        }
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <FormContainer
                title="Nuevo contacto"
                subtitle="Crea la persona y reutilízala en sus préstamos."
                icon={<UserPlus size={20} />}
                error={error}
                className="max-w-lg mx-auto"
                onClose={onClose}
            >
                <form className="form-default-container" onSubmit={submit}>
                    <TextInput
                        label="Nombre de la persona"
                        icon="User"
                        placeholder="Ej. Ana Torres"
                        value={name}
                        onChange={setName}
                        disabled={createContact.isPending}
                        required
                    />

                    <div className="form-actions-container">
                        <button type="submit" className="btn-submit" disabled={createContact.isPending}>
                            <CheckCircle2 size={15} />
                            {createContact.isPending ? "Creando..." : "Crear contacto"}
                        </button>
                    </div>
                </form>
            </FormContainer>
        </ModalPortal>
    );
}
