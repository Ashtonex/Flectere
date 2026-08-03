import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Logo({
  size = 44,
  withWordmark = true,
  wordmarkClassName = "text-lg",
  href = "/",
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  wordmarkClassName?: string;
  href?: string | null;
  className?: string;
}) {
  const inner = (
    <span className={cn("flex items-center gap-4", className)}>
      <Image
        src="/brand/flectere-mark.png"
        alt="Flectēre"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        priority
      />
      {withWordmark && (
        <span
          className={cn(
            "font-display uppercase tracking-[0.18em] text-fog-100",
            wordmarkClassName
          )}
        >
          Flect<span className="text-gold">ē</span>re
        </span>
      )}
    </span>
  );

  if (!href) return inner;

  return (
    <Link href={href} className="inline-flex">
      {inner}
    </Link>
  );
}
