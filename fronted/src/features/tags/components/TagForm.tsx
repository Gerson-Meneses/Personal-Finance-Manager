import { useState } from "react";
import { Loader2, Tag as TagIcon } from "lucide-react";
import { useTags } from "../hooks";
import type { Tag } from "../types";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { ColorPicker } from "../../../shared/components/ColorPicker/ColorPicker";
import { useToast } from "../../../shared/Hooks/useToast";

interface Props {
    tag?: Tag;
    onClose: () => void;
    onSuccess: () => void;
}

export function TagForm({ tag, onClose, onSuccess }: Props) {
    const { createTag, updateTag } = useTags();
    const toast = useToast();
    const [name, setName] = useState(tag?.name ?? "");
    const [color, setColor] = useState(tag?.color ?? "#64748b");
    const [formError, setFormError] = useState<string | null>(null);
    const isPending = createTag.isPending || updateTag.isPending;

    const submit = async () => {
        const trimmed = name.trim();
        if (trimmed.length < 2) {
            setFormError("El nombre debe tener al menos 2 caracteres");
            return;
        }

        setFormError(null);
        try {
            if (tag) {
                await updateTag.mutateAsync({ tagId: tag.id, name: trimmed, color });
                toast.success("Etiqueta actualizada");
            } else {
                await createTag.mutateAsync({ name: trimmed, color });
                toast.success("Etiqueta creada");
            }
            onSuccess();
        } catch (error) {
            setFormError(
                error instanceof Error
                    ? error.message
                    : "No se pudo guardar la etiqueta"
            );
        }
    };

    return (
        <FormContainer
            title={tag ? "Editar etiqueta" : "Nueva etiqueta"}
            icon={<TagIcon size={20} />}
            error={formError}
            className="max-w-md mx-auto"
            onClose={onClose}
        >
            <form
                className="form-default-container"
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
            >
                <TextInput
                    label="Nombre"
                    icon="Tag"
                    value={name}
                    onChange={setName}
                    placeholder="Ej. Trabajo, Vacaciones…"
                    disabled={isPending}
                    required
                />

                <ColorPicker
                    label="Color"
                    value={color}
                    onChange={setColor}
                    disabled={isPending}
                />

                <div className="tag-preview">
                    <span
                        className="tag-manager-chip"
                        style={{
                            borderColor: color,
                            background: `${color}1a`,
                            color,
                        }}
                    >
                        {name.trim() || "Etiqueta"}
                    </span>
                </div>

                <div className="form-default-row form-actions-container">
                    <button
                        type="submit"
                        className="btn-submit income"
                        disabled={isPending}
                    >
                        {isPending && (
                            <Loader2 size={14} className="tag-spinner" />
                        )}
                        {isPending
                            ? "Guardando…"
                            : tag
                                ? "Actualizar"
                                : "Crear etiqueta"}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
