import "./Highlighttext.css";

interface Props {
    text: string;
    term: string;
    className?: string;
}

const removeDiacritics = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Renderiza un texto resaltando las coincidencias con el término de búsqueda.
 * Case-insensitive y sin sensibilidad a tildes.
 */
export function HighlightText({ text, term, className }: Props) {
    if (!term.trim()) {
        return <span className={className}>{text}</span>;
    }

    const normalizedText = removeDiacritics(text);
    const normalizedTerm = removeDiacritics(term.trim());
    const parts: React.ReactNode[] = [];
    let cursor = 0;

    while (cursor < text.length) {
        const matchIndex = normalizedText.indexOf(normalizedTerm, cursor);

        if (matchIndex === -1) {
            parts.push(text.slice(cursor));
            break;
        }

        // Texto antes de la coincidencia
        if (matchIndex > cursor) {
            parts.push(text.slice(cursor, matchIndex));
        }

        // La coincidencia resaltada
        parts.push(
            <mark key={matchIndex} className="hl-mark">
                {text.slice(matchIndex, matchIndex + normalizedTerm.length)}
            </mark>
        );

        cursor = matchIndex + normalizedTerm.length;
    }

    return <span className={className}>{parts}</span>;
}