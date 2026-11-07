interface StyleRule {
    keywords: string[];
    color: string;
    icon: string;
}

const STYLE_RULES: StyleRule[] = [
    {
        keywords: ["comida", "almuerzo", "cena", "super", "mercado", "almacen", "abarrotes", "restaurante", "cafe", "pizza", "hamburguesa", "desayuno", "almacen"],
        color: "#F97316",
        icon: "utensils",
    },
    {
        keywords: ["transporte", "uber", "taxi", "metro", "bus", "combustible", "gasolina", "parking", "peaje", "gasolina"],
        color: "#0EA5E9",
        icon: "car",
    },
    {
        keywords: ["alquiler", "arriendo", "renta", "hipoteca", "casa", "vivienda", "hogar", "departamento"],
        color: "#6366F1",
        icon: "home",
    },
    {
        keywords: ["luz", "agua", "internet", "telefono", "celular", "electric", "servicio", "luz", "telecom"],
        color: "#EAB308",
        icon: "zap",
    },
    {
        keywords: ["cine", "netflix", "spotify", "juego", "videojuego", "musica", "concierto", "streaming", "tv"],
        color: "#8B5CF6",
        icon: "clapperboard",
    },
    {
        keywords: ["salud", "farmacia", "medico", "doctor", "hospital", "medic", "clinica", "dentista", "consulta"],
        color: "#EF4444",
        icon: "activity",
    },
    {
        keywords: ["educacion", "curso", "universidad", "colegio", "libro", "escuela", "tutor", "matricula"],
        color: "#10B981",
        icon: "graduation-cap",
    },
    {
        keywords: ["ropa", "zapato", "vestido", "calzado", "shopping", "tienda"],
        color: "#EC4899",
        icon: "shopping-bag",
    },
    {
        keywords: ["mantenimiento", "reparacion", "taller", "arreglo", "servicio tecnico"],
        color: "#78350F",
        icon: "wrench",
    },
    {
        keywords: ["suscripcion", "suscrib", "membresia", "plan mensual"],
        color: "#475569",
        icon: "refresh-cw",
    },
    {
        keywords: ["prestamo", "credito", "cuota", "deuda", "tarjeta de credito"],
        color: "#941751",
        icon: "landmark",
    },
    {
        keywords: ["viaje", "vuelo", "hotel", "vacaciones", "turismo", "aeropuerto"],
        color: "#14B8A6",
        icon: "plane",
    },
    {
        keywords: ["mascota", "perro", "gato", "veterinario", "pet", "alimento para mascota"],
        color: "#F59E0B",
        icon: "paw-print",
    },
    {
        keywords: ["impuesto", "impuestos", "banco", "comision", "interes", "transferencia"],
        color: "#64748B",
        icon: "receipt",
    },
    {
        keywords: ["salario", "sueldo", "nomina", "haberes"],
        color: "#22C55E",
        icon: "banknote",
    },
    {
        keywords: ["venta", "ventas", "cliente", "negocio"],
        color: "#16A34A",
        icon: "store",
    },
    {
        keywords: ["freelance", "honorario", "project", "proyecto", "consultoria"],
        color: "#059669",
        icon: "laptop",
    },
    {
        keywords: ["regalo", "cumple", "cumpleanos", "aniversario", "navidad"],
        color: "#F472B6",
        icon: "gift",
    },
    {
        keywords: ["inversion", "inversiones", "dividendo", "rendimiento", "accion", "acciones", "bolsa"],
        color: "#84CC16",
        icon: "trending-up",
    },
];

const normalize = (str: string) =>
    str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

export interface CategoryStyle {
    color: string;
    icon: string;
}

export function suggestCategoryStyle(name: string): CategoryStyle | null {
    const normalized = normalize(name);
    if (normalized.trim().length < 2) return null;

    let best: { rule: StyleRule; hits: number } | null = null;
    for (const rule of STYLE_RULES) {
        let hits = 0;
        for (const keyword of rule.keywords) {
            if (normalized.includes(keyword)) hits += 1;
        }
        if (hits > 0 && (!best || hits > best.hits)) {
            best = { rule, hits };
        }
    }

    if (!best) return null;
    return { color: best.rule.color, icon: best.rule.icon };
}
