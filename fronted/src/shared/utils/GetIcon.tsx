import * as LucideIcons from "lucide-react";

const toPascalFormat = (string: string) => string
    .trim()
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

interface GetIconProps {
    defaultIcon?: string;
    size?: number;
    color?: string;
}

export const getIcon = (iconName: string, props?: GetIconProps) => {
    const { defaultIcon, size = 20, color = "currentColor" } = props || {};
    let IconComponent = (LucideIcons as any)[toPascalFormat(iconName)] || (LucideIcons as any)[defaultIcon ? toPascalFormat(defaultIcon) : "CircleEllipsis"]
    if (!IconComponent) IconComponent = (LucideIcons as any)["CircleEllipsis"]
    return <IconComponent size={size} color={color} />;
};