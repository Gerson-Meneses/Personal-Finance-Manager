import { useMemo, useState } from "react";
import { Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { useTags } from "../hooks";
import type { Tag } from "../types";
import { SearchInput } from "../../../shared/components/SearchInput/SearchInput";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import InfoModal from "../../../shared/components/InfoModal/InfoModal";
import { useToast } from "../../../shared/Hooks/useToast";
import { TagForm } from "./TagForm";
import "./TagsManager.css";

interface Props {
    /** Oculta la cabecera interna cuando se embebe en otra página. */
    embedded?: boolean;
}

export function TagsManager({ embedded = false }: Props) {
    const { tags, loading, isError, error, refetch, deleteTag } = useTags();
    const toast = useToast();
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Tag | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Tag | null>(null);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return tags
            .filter((tag) => !term || tag.name.toLowerCase().includes(term))
            .sort((a, b) => a.name.localeCompare(b.name, "es"));
    }, [tags, search]);

    return (
        <section className={`card tags-manager ${embedded ? "is-embedded" : ""}`}>
            <div className="tags-manager__head">
                <div className="tags-manager__heading">
                    <h3>
                        <TagIcon size={16} />
                        Etiquetas
                        <span className="tags-manager__count">{tags.length}</span>
                    </h3>
                    <p className="text-muted">
                        Clasifica movimientos con etiquetas opcionales. Puedes
                        asignarlas desde el formulario de transacción.
                    </p>
                </div>

                <div className="tags-manager__actions">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Buscar etiqueta..."
                    />
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                            setEditing(null);
                            setShowForm(true);
                        }}
                    >
                        <Plus size={16} />
                        Nueva etiqueta
                    </button>
                </div>
            </div>

            {isError ? (
                <div className="tags-manager__empty">
                    <p>No se pudieron cargar las etiquetas.</p>
                    <p className="text-muted">
                        {error?.message || "Error inesperado"}
                    </p>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => refetch()}
                    >
                        Reintentar
                    </button>
                </div>
            ) : loading && tags.length === 0 ? (
                <div className="tags-manager__empty">
                    <p className="text-muted">Cargando etiquetas…</p>
                </div>
            ) : tags.length === 0 ? (
                <div className="tags-manager__empty">
                    <TagIcon size={24} />
                    <p>Aún no tienes etiquetas.</p>
                    <p className="text-muted">
                        Son opcionales: úsalas si quieres agrupar movimientos
                        más allá de la categoría.
                    </p>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus size={15} />
                        Crear la primera
                    </button>
                </div>
            ) : visible.length === 0 ? (
                <div className="tags-manager__empty">
                    <p>No se encontraron etiquetas para “{search}”.</p>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setSearch("")}
                    >
                        Limpiar búsqueda
                    </button>
                </div>
            ) : (
                <ul className="tags-manager__list">
                    {visible.map((tag) => (
                        <li key={tag.id}>
                            <span className="tags-manager__main">
                                <span
                                    className="tags-manager__dot"
                                    style={{ background: tag.color }}
                                />
                                <span
                                    className="tag-manager-chip"
                                    style={{
                                        borderColor: tag.color,
                                        background: `${tag.color}1a`,
                                        color: tag.color,
                                    }}
                                >
                                    {tag.name}
                                </span>
                                <span className="tags-manager__usage">
                                    {tag.usageCount ?? 0} uso
                                    {(tag.usageCount ?? 0) === 1 ? "" : "s"}
                                </span>
                            </span>

                            <span className="tags-manager__row-actions">
                                <button
                                    type="button"
                                    className="tooltip-left"
                                    onClick={() => {
                                        setEditing(tag);
                                        setShowForm(false);
                                    }}
                                    aria-label={`Editar ${tag.name}`}
                                    data-tooltip="Editar"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    type="button"
                                    className="is-danger tooltip-left"
                                    onClick={() => setPendingDelete(tag)}
                                    aria-label={`Eliminar ${tag.name}`}
                                    data-tooltip="Eliminar"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            <ModalPortal
                isOpen={showForm || !!editing}
                onClose={() => {
                    setShowForm(false);
                    setEditing(null);
                }}
            >
                <TagForm
                    tag={editing ?? undefined}
                    onClose={() => {
                        setShowForm(false);
                        setEditing(null);
                    }}
                    onSuccess={() => {
                        setShowForm(false);
                        setEditing(null);
                    }}
                />
            </ModalPortal>

            <InfoModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    deleteTag.mutate(pendingDelete.id, {
                        onSuccess: () => {
                            toast.success("Etiqueta eliminada");
                            setPendingDelete(null);
                        },
                        onError: (deleteError) => {
                            toast.error(
                                deleteError.message ||
                                    "No se pudo eliminar la etiqueta"
                            );
                            setPendingDelete(null);
                        },
                    });
                }}
                type="error"
                title="Eliminar etiqueta"
                message={`¿Eliminar la etiqueta "${pendingDelete?.name}"? Se quitará de todos los movimientos que la usen.`}
                confirmText={deleteTag.isPending ? "Eliminando…" : "Eliminar"}
                cancelText="Cancelar"
                confirmDisabled={deleteTag.isPending}
            />
        </section>
    );
}
