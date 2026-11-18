import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Tag as TagIcon, X } from "lucide-react";
import { useTags } from "../hooks";
import type { Tag } from "../types";
import { useToast } from "../../../shared/Hooks/useToast";
import "./TagSelector.css";

const PALETTE = ["#64748b", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#eab308", "#22c55e", "#14b8a6"];

const pickColor = (name: string) => {
    let hash = 0;
    for (let index = 0; index < name.length; index += 1) {
        hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
    }
    return PALETTE[hash % PALETTE.length];
};

interface Props {
    value?: string[];
    onChange: (tagIds: string[]) => void;
    label?: string;
    disabled?: boolean;
    error?: string;
}

export function TagSelector({
    value = [],
    onChange,
    label = "Etiquetas",
    disabled,
    error,
}: Props) {
    const { tags, loading, createTag } = useTags();
    const toast = useToast();
    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const selected = useMemo(
        () => value.map((id) => tags.find((tag) => tag.id === id)).filter((tag): tag is Tag => !!tag),
        [tags, value]
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        const available = tags.filter((tag) => !value.includes(tag.id));
        if (!term) return available;
        return available.filter((tag) => tag.name.toLowerCase().includes(term));
    }, [tags, search, value]);

    const exactExists = tags.some(
        (tag) => tag.name.toLowerCase() === search.trim().toLowerCase()
    );

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const toggle = (id: string) => {
        onChange(
            value.includes(id)
                ? value.filter((tagId) => tagId !== id)
                : [...value, id]
        );
    };

    const handleCreate = async () => {
        const name = search.trim();
        if (name.length < 2) return;
        try {
            const created = await createTag.mutateAsync({
                name,
                color: pickColor(name),
            });
            onChange([...value, created.id]);
            setSearch("");
            setOpen(false);
            toast.success("Etiqueta creada");
        } catch (createError) {
            toast.error(
                createError instanceof Error ? createError.message : "No se pudo crear la etiqueta"
            );
        }
    };

    return (
        <div
            ref={rootRef}
            className={`tag-selector ${error ? "has-error" : ""} ${disabled ? "disabled" : ""}`}
        >
            <div className="tag-selector__head">
                <span className="input-label">
                    <TagIcon size={14} />
                    {label}
                </span>
                <button
                    type="button"
                    className="tag-selector__add"
                    onClick={() => setOpen((prev) => !prev)}
                    disabled={disabled}
                    aria-expanded={open}
                >
                    <Plus size={13} />
                    Agregar
                </button>
            </div>

            <div className="tag-selector__chips">
                {selected.length === 0 && (
                    <span className="tag-selector__empty">Sin etiquetas</span>
                )}
                {selected.map((tag) => (
                    <span
                        key={tag.id}
                        className="tag-chip"
                        style={{
                            borderColor: tag.color,
                            background: `${tag.color}1a`,
                        }}
                    >
                        <span
                            className="tag-chip__dot"
                            style={{ background: tag.color }}
                            aria-hidden="true"
                        />
                        {tag.name}
                        <button
                            type="button"
                            onClick={() => toggle(tag.id)}
                            disabled={disabled}
                            aria-label={`Quitar etiqueta ${tag.name}`}
                        >
                            <X size={11} />
                        </button>
                    </span>
                ))}
            </div>

            {open && (
                <div className="tag-selector__panel">
                    <input
                        type="text"
                        className="tag-selector__search"
                        placeholder="Buscar o crear etiqueta..."
                        value={search}
                        autoFocus
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                if (filtered[0] && !search.trim()) toggle(filtered[0].id);
                                else if (search.trim() && !exactExists) void handleCreate();
                                else if (filtered[0]) toggle(filtered[0].id);
                            }
                            if (event.key === "Escape") {
                                event.stopPropagation();
                                setOpen(false);
                            }
                        }}
                    />

                    <div className="tag-selector__list">
                        {loading && (
                            <span className="tag-selector__empty">
                                <Loader2 size={13} className="tag-selector__spinner" /> Cargando…
                            </span>
                        )}
                        {!loading && filtered.length === 0 && !search.trim() && (
                            <span className="tag-selector__empty">Aún no tienes etiquetas.</span>
                        )}
                        {filtered.map((tag) => (
                            <button
                                key={tag.id}
                                type="button"
                                className="tag-selector__option"
                                onClick={() => toggle(tag.id)}
                            >
                                <span className="tag-selector__dot" style={{ background: tag.color }} />
                                {tag.name}
                            </button>
                        ))}
                        {search.trim().length >= 2 && !exactExists && (
                            <button
                                type="button"
                                className="tag-selector__option is-create"
                                onClick={() => void handleCreate()}
                                disabled={createTag.isPending}
                            >
                                {createTag.isPending ? (
                                    <Loader2 size={13} className="tag-selector__spinner" />
                                ) : (
                                    <Plus size={13} />
                                )}
                                Crear «{search.trim()}»
                            </button>
                        )}
                    </div>
                </div>
            )}

            {error && <span className="error-text">{error}</span>}
        </div>
    );
}
