import * as LucideIcons from "lucide-react";
import type { ComponentType } from "react";

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

type IconComponent = ComponentType<{ size?: number; color?: string }>;

const icons = LucideIcons as unknown as Record<string, IconComponent>;

export const getIcon = (iconName: string, props?: GetIconProps) => {
    const { defaultIcon, size = 20, color = "currentColor" } = props || {};
    const Icon =
        icons[toPascalFormat(iconName)] ||
        icons[toPascalFormat(defaultIcon ?? "")] ||
        icons.CircleEllipsis;

    if (!Icon) return null;
    return <Icon size={size} color={color} />;
};
