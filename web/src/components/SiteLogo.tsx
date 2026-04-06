import Image from "next/image";
import Link from "next/link";

type Props = {
  className?: string;
  priority?: boolean;
  /** Header vs footer sizing */
  variant?: "header" | "footer" | "hero";
  onNavigate?: () => void;
};

export function SiteLogo({
  className = "",
  priority = false,
  variant = "header",
  onNavigate,
}: Props) {
  const size =
    variant === "hero"
      ? "h-28 w-auto sm:h-36 md:h-44"
      : variant === "footer"
        ? "h-14 w-auto sm:h-16"
        : "h-10 w-auto sm:h-11";

  return (
    <Link
      href="/"
      className={`group relative inline-flex shrink-0 items-center ${className}`}
      onClick={onNavigate}
    >
      <Image
        src="/glow-arena-logo.png"
        alt="Glow Arena — Light Up Your Play"
        width={320}
        height={120}
        className={`${size} object-contain object-left drop-shadow-[0_0_14px_rgba(0,245,255,0.4)] drop-shadow-[0_0_28px_rgba(255,45,140,0.18)] transition-[filter] duration-300 group-hover:drop-shadow-[0_0_22px_rgba(0,245,255,0.6)] group-hover:drop-shadow-[0_0_40px_rgba(255,45,140,0.28)]`}
        priority={priority}
      />
    </Link>
  );
}
