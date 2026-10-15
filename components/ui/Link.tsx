import NextLink from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof NextLink> & { external?: boolean };

export function Link({ className, external, ...props }: Props) {
  return (
    <NextLink
      className={cn("underline underline-offset-2 hover:text-[var(--color-ink-soft)]", className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    />
  );
}
