import { useState } from "react";

export const TruncateText = ({ text, maxLength = 120, classname }: { text: string; maxLength?: number; classname?: string }) => {

    const [textExpanded, setTextExpanded] = useState(false);
    const isLongText = text.length > maxLength;
    text = text.trim();

    return <span className={classname}>
        {textExpanded || !isLongText ? text + ". " : `${text.slice(0, maxLength).trim()}... `}
        {isLongText && (
            <>
                <button className="text-blue-600 cursor-pointer" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setTextExpanded(prev => !prev)}}>
                    {textExpanded ? "Ver menos" : "Ver más"}
                </button>
            </>
        )}

    </span>;
}