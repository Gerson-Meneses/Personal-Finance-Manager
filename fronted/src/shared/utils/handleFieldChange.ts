import type { DetailsError } from "../dataApiInterface";

export const handleFieldChange = <T extends object>(
    field: keyof T,
    value: T[keyof T],
    setFormData: React.Dispatch<React.SetStateAction<T>> | React.Dispatch<React.SetStateAction<Partial<T>>>,
    setErrors: React.Dispatch<React.SetStateAction<DetailsError<T> | null>>
) => {
    setFormData((prev:any) => ({ ...prev, [field]: value }));

    setErrors((prev: any) => {
        if (!prev || !prev[field]) return prev;

        const newErrors = { ...prev };
        delete newErrors[field];

        return Object.keys(newErrors).length > 0 ? newErrors : null;
    });
};