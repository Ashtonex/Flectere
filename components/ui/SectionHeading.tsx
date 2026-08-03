import { cn } from "@/lib/utils";
import RevealOnScroll from "./RevealOnScroll";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <RevealOnScroll
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="font-display text-3xl leading-[1.1] tracking-tight text-fog-100 sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-fog-400 sm:text-lg">
          {description}
        </p>
      )}
    </RevealOnScroll>
  );
}
