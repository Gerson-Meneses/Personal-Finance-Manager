export const getDaysInMonth = (month: string, year?: string) => {
    if (!year) {
        year = String(new Date().getFullYear())
    }
    if (!year || !month) return 31
    return new Date(Number(year), Number(month), 0).getDate()
}

export const generateYears = (startYear?: number) => {
    const currentYear = new Date().getFullYear()
    if (!startYear) {
        startYear = currentYear - 100
    }

    return Array.from(
        { length: currentYear - startYear + 1 },
        (_, i) => currentYear - i
    )
}

export const months = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" }
]