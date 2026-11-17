import { useMemo, useState } from "react";
import { CheckCircle2, Merge, Pencil, Users } from "lucide-react";
import { useContacts } from "../../../features/contacts/hooks";
import type { Contact } from "../../../features/contacts/types";
import { useLoanSummary } from "../../../features/loans/hooks";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import { SearchInput } from "../../../shared/components/SearchInput/SearchInput";
import { QueryErrorState } from "../../../shared/components/QueryErrorState/QueryErrorState";
import { useToast } from "../../../shared/Hooks/useToast";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import "./ContactsPage.css";

const normalize = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const getInitials = (name: string) =>
    name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

export default function ContactsPage() {
    const { contacts, loading, fetching, error: queryError, refetch, updateContact, mergeContacts } = useContacts();
    const { summary } = useLoanSummary({ status: "PENDING" });
    const toast = useToast();
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState<Contact | null>(null);
    const [merging, setMerging] = useState<Contact | null>(null);
    const [name, setName] = useState("");
    const [notes, setNotes] = useState("");
    const [targetId, setTargetId] = useState("");
    const [error, setError] = useState<string | null>(null);

    const summaryByContact = useMemo(() => {
        const map = new Map<string, { given: number; received: number; count: number }>();
        for (const item of summary) {
            const key = item.contactId ?? item.lender;
            const current = map.get(key) ?? { given: 0, received: 0, count: 0 };
            current.given += item.byType.GIVEN?.totalRemaining ?? 0;
            current.received += item.byType.RECEIVED?.totalRemaining ?? 0;
            current.count += item.total.loanCount;
            map.set(key, current);
        }
        return map;
    }, [summary]);

    const visible = useMemo(() => {
        const q = normalize(search.trim());
        return contacts.filter((contact) => !q || normalize(contact.name).includes(q));
    }, [contacts, search]);

    const totals = useMemo(() => {
        let given = 0;
        let received = 0;
        for (const contact of contacts) {
            const item = summaryByContact.get(contact.id) ?? summaryByContact.get(contact.name);
            given += item?.given ?? 0;
            received += item?.received ?? 0;
        }
        return { given, received };
    }, [contacts, summaryByContact]);

    const openEdit = (contact: Contact) => {
        setEditing(contact);
        setName(contact.name);
        setNotes(contact.notes ?? "");
        setError(null);
    };

    const submitEdit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!editing) return;
        if (name.trim().length < 3) return setError("El nombre debe tener al menos 3 caracteres");
        try {
            await updateContact.mutateAsync({
                id: editing.id,
                data: { name: name.trim(), notes: notes.trim() || null },
            });
            toast.success("Contacto actualizado");
            setEditing(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar el contacto");
        }
    };

    const submitMerge = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!merging || !targetId) return setError("Selecciona el contacto destino");
        try {
            await mergeContacts.mutateAsync({ id: merging.id, targetContactId: targetId });
            toast.success("Contactos fusionados");
            setMerging(null);
            setTargetId("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudieron fusionar los contactos");
        }
    };

    if (loading) return <LoadingScreen message="Cargando contactos..." />;

    if (queryError && contacts.length === 0) {
        return (
            <div className="page-container contacts-page">
                <QueryErrorState
                    title="No se pudieron cargar los contactos"
                    error={queryError instanceof Error ? queryError.message : String(queryError)}
                    onRetry={() => refetch()}
                    retrying={fetching}
                />
            </div>
        );
    }

    return (
        <div className="page-container contacts-page">
            <header className="contacts-header card">
                <div>
                    <span className="contacts-header__eyebrow">Personas y deudas</span>
                    <h1>Contactos</h1>
                    <p className="text-muted">Consolida deuda por persona y fusiona duplicados.</p>
                </div>
                <SearchInput value={search} onChange={setSearch} placeholder="Buscar contacto..." />
            </header>

            <section className="contacts-stats">
                <article className="contact-stat card">
                    <Users size={18} />
                    <div><span>Contactos</span><strong>{contacts.length}</strong></div>
                </article>
                <article className="contact-stat card">
                    <span className="text-success">+</span>
                    <div><span>Me deben</span><strong className="text-success">{formatCurrency(totals.given)}</strong></div>
                </article>
                <article className="contact-stat card">
                    <span className="text-danger">−</span>
                    <div><span>Yo debo</span><strong className="text-danger">{formatCurrency(totals.received)}</strong></div>
                </article>
            </section>

            {visible.length === 0 ? (
                <div className="empty-state card"><p>No se encontraron contactos.</p></div>
            ) : (
                <div className="contacts-grid">
                    {visible.map((contact) => {
                        const debt = summaryByContact.get(contact.id) ?? summaryByContact.get(contact.name);
                        const net = (debt?.given ?? 0) - (debt?.received ?? 0);
                        return (
                            <article key={contact.id} className="contact-card card">
                                <header>
                                    <span className="contact-card__avatar">{getInitials(contact.name)}</span>
                                    <div>
                                        <h3>{contact.name}</h3>
                                        <small>{debt?.count ?? 0} préstamo{debt?.count === 1 ? "" : "s"} activo{debt?.count === 1 ? "" : "s"}</small>
                                    </div>
                                    <strong className={net >= 0 ? "text-success" : "text-danger"}>
                                        {formatCurrency(Math.abs(net))}
                                    </strong>
                                </header>
                                {contact.notes && <p>{contact.notes}</p>}
                                <div className="contact-card__rows">
                                    <span>Me deben <strong className="text-success">{formatCurrency(debt?.given ?? 0)}</strong></span>
                                    <span>Yo debo <strong className="text-danger">{formatCurrency(debt?.received ?? 0)}</strong></span>
                                </div>
                                <footer>
                                    <button type="button" className="btn-secondary" onClick={() => openEdit(contact)}>
                                        <Pencil size={13} /> Editar
                                    </button>
                                    <button type="button" className="btn-ghost" onClick={() => { setMerging(contact); setTargetId(""); setError(null); }}>
                                        <Merge size={13} /> Fusionar
                                    </button>
                                </footer>
                            </article>
                        );
                    })}
                </div>
            )}

            <ModalPortal isOpen={!!editing} onClose={() => setEditing(null)}>
                {editing && (
                    <FormContainer title="Editar contacto" icon={<Pencil size={20} />} error={error} className="max-w-lg mx-auto" onClose={() => setEditing(null)}>
                        <form className="form-default-container" onSubmit={submitEdit}>
                            <TextInput label="Nombre" icon="User" value={name} onChange={setName} disabled={updateContact.isPending} required />
                            <TextInput label="Notas" icon="AlignLeft" value={notes} onChange={setNotes} disabled={updateContact.isPending} textarea />
                            <div className="form-actions-container">
                                <button type="submit" className="btn-submit" disabled={updateContact.isPending}>
                                    <CheckCircle2 size={15} /> Guardar contacto
                                </button>
                            </div>
                        </form>
                    </FormContainer>
                )}
            </ModalPortal>

            <ModalPortal isOpen={!!merging} onClose={() => setMerging(null)}>
                {merging && (
                    <FormContainer title="Fusionar contactos" icon={<Merge size={20} />} error={error} className="max-w-lg mx-auto" onClose={() => setMerging(null)}>
                        <form className="form-default-container" onSubmit={submitMerge}>
                            <p className="text-muted">Todo el historial de <strong>{merging.name}</strong> pasará al contacto destino.</p>
                            <SelectInput
                                label="Contacto destino"
                                icon="Users"
                                value={targetId}
                                onChange={setTargetId}
                                options={contacts.filter((item) => item.id !== merging.id).map((item) => ({ value: item.id, label: item.name }))}
                                disabled={mergeContacts.isPending}
                                required
                            />
                            <div className="form-actions-container">
                                <button type="submit" className="btn-submit" disabled={mergeContacts.isPending || !targetId}>
                                    <Merge size={15} /> Fusionar
                                </button>
                            </div>
                        </form>
                    </FormContainer>
                )}
            </ModalPortal>
        </div>
    );
}
