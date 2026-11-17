import { ICON_REGISTRY } from "./iconRegistry";

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
    const Icon =
        ICON_REGISTRY[toPascalFormat(iconName)] ||
        ICON_REGISTRY[toPascalFormat(defaultIcon ?? "")] ||
        ICON_REGISTRY.CircleEllipsis;

    if (!Icon) return null;
    return <Icon size={size} color={color} />;
};
