"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CheckCircle,
  Info,
  Warning,
  XCircle,
  Spinner,
} from "@phosphor-icons/react";
import { Icon } from "./icon";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <Icon icon={CheckCircle} weight="fill" className="size-4" />,
        info: <Icon icon={Info} weight="fill" className="size-4" />,
        warning: <Icon icon={Warning} weight="fill" className="size-4" />,
        error: <Icon icon={XCircle} weight="fill" className="size-4" />,
        loading: <Icon icon={Spinner} className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
