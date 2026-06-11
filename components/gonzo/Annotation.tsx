import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  rotation?: number; // degrees, -4 to 4
};

export function Annotation({ children, className, rotation = -1 }: Props) {
  return (
    <span
      className={cn("font-hand text-[var(--color-red)] text-sm absolute", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
