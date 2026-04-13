export const categoriesBase = [
    // GASTOS (EXPENSE)
    {
        name: "ALIMENTACIÓN",
        type: "EXPENSE",
        icon: "utensils",
        color: "#F97316" // Naranja
    },
    {
        name: "TRANSPORTE",
        type: "EXPENSE",
        icon: "car",
        color: "#0EA5E9" // Azul
    },
    {
        name: "VIVIENDA",
        type: "EXPENSE",
        icon: "home",
        color: "#6366F1" // Indigo
    },
    {
        name: "SERVICIOS",
        type: "EXPENSE",
        icon: "zap", // Cambiado de 'bolt' a 'zap' (más estándar en Lucide)
        color: "#EAB308" // Amarillo
    },
    {
        name: "ENTRETENIMIENTO",
        type: "EXPENSE",
        icon: "clapperboard",
        color: "#8B5CF6" // Morado
    },
    {
        name: "SALUD",
        type: "EXPENSE",
        icon: "activity", // Cambiado de 'heart-pulse' a 'activity'
        color: "#EF4444" // Rojo
    },
    {
        name: "EDUCACIÓN",
        type: "EXPENSE",
        icon: "graduation-cap",
        color: "#10B981" // Esmeralda
    },
    {
        name: "COMPRAS",
        type: "EXPENSE",
        icon: "shopping-bag",
        color: "#EC4899" // Rosa
    },
    {
        name: "MANTENIMIENTO", // Agregada (Hogar, Vehículos, etc.)
        type: "EXPENSE",
        icon: "wrench",
        color: "#78350F" 
    },
    {
        name: "SUSCRIPCIONES",
        type: "EXPENSE",
        icon: "refresh-cw", // Cambiado de 'calendar-sync' a 'refresh-cw'
        color: "#475569"
    },
    {
        name: "DEVOLUCIÓN DE PRÉSTAMO",
        type: "EXPENSE",
        icon: "hand-coins", // Icono más descriptivo de pagar
        color: "#0D727F"
    },
    {
        name: "PRÉSTAMOS",
        type: "EXPENSE",
        icon: "landmark", 
        color: "#941751"
    },
    {
        name: "OTROS GASTOS",
        type: "EXPENSE",
        icon: "archive", // Cambiado de 'shredder'
        color: "#94A3B8"
    },

    // INGRESOS (INCOME)
    {
        name: "SUELDO",
        type: "INCOME",
        icon: "banknote",
        color: "#22C55E" // Verde
    },
    {
        name: "VENTAS", // Agregada (Muy útil si el usuario vende algo ocasional)
        type: "INCOME",
        icon: "store",
        color: "#16A34A"
    },
    {
        name: "FREELANCE",
        type: "INCOME",
        icon: "laptop",
        color: "#059669" 
    },
    {
        name: "REGALOS",
        type: "INCOME",
        icon: "gift",
        color: "#F472B6" 
    },
    {
        name: "DEVOLUCIÓN DE PRÉSTAMO",
        type: "INCOME",
        icon: "receipt-cent",
        color: "#8B5CF6" 
    },
    {
        name: "PRÉSTAMOS",
        type: "INCOME",
        icon: "piggy-bank", 
        color: "#06B6D4"
    },
    {
        name: "INVERSIONES",
        type: "INCOME",
        icon: "trending-up",
        color: "#84CC16"
    },
    {
        name: "OTROS INGRESOS",
        type: "INCOME",
        icon: "circle-ellipsis",
        color: "#86EFAC"
    },

    // TIPOS ÚNICOS
    {
        name: "TRANSFERENCIA",
        type: "TRANSFER",
        icon: "arrow-left-right",
        color: "#64748B",
    },
    {
        name: "PAGO DE TARJETA",
        type: "CREDIT_PAYMENT",
        icon: "credit-card",
        color: "#1E1B4B"
    }
];