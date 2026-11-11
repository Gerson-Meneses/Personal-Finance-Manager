import type { DetailsError } from "../dataApiInterface";

export const handleFieldChange = <T extends object>(
    field: keyof T,
    value: T[keyof T],
    setFormData: React.Dispatch<React.SetStateAction<T>> | React.Dispatch<React.SetStateAction<Partial<T>>>,
    setErrors: React.Dispatch<React.SetStateAction<DetailsError<T> | null>>
) => {
    const updateForm = setFormData as React.Dispatch<React.SetStateAction<Partial<T>>>;
    updateForm((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => {
        if (!prev || !prev[field]) return prev;

        const newErrors: DetailsError<T> = { ...prev };
        delete newErrors[field];

        return Object.keys(newErrors).length > 0 ? newErrors : null;
    });
};
