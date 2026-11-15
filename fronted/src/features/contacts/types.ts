export interface Contact {
    id: string;
    name: string;
    normalizedName: string;
    notes?: string | null;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
}
