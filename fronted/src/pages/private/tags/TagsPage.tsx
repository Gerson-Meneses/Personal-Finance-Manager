import { TagsManager } from "../../../features/tags/components/TagsManager";
import "./TagsPage.css";

export default function TagsPage() {
    return (
        <div className="page-container tags-page">
            <header className="page-header card tags-header">
                <div>
                    <h1>Etiquetas</h1>
                    <p className="text-muted">
                        Clasifica tus movimientos con etiquetas reutilizables.
                    </p>
                </div>
            </header>

            <TagsManager embedded />
        </div>
    );
}
