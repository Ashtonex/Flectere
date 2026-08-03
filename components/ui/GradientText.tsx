import { cn } from "@/lib/utils";

export default function GradientText({
  children,
  className,
  animate = false,
}: {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-gradient",
        animate && "animate-gradient-pan",
        className
      )}
    >
      {children}
    </span>
  );
}
