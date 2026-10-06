import React from "react";
import type {
  IconWeight,
  IconProps as PhosphorIconProps,
} from "@phosphor-icons/react";

type IconSize = "sm" | "md" | "lg" | number;

type PhosphorIconComponent = React.FC<any>;

export interface IconProps {
  icon: PhosphorIconComponent;
  size?: IconSize;
  weight?: IconWeight;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

const sizeMap: Record<string, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function Icon({
  icon: IconComponent,
  size = "md",
  weight = "regular",
  className,
  style,
  ...rest
}: IconProps) {
  const resolvedSize = typeof size === "string" ? (sizeMap[size] ?? 20) : size;

  return (
    <IconComponent
      size={resolvedSize}
      weight={weight}
      className={className}
      style={style}
      {...rest}
    />
  );
}
