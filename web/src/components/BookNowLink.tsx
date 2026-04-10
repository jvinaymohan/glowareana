"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

type BookNowLinkProps = {
  href?: string;
  className?: string;
  source: string;
  children?: ReactNode;
};

export function BookNowLink({
  href = "/book",
  className,
  source,
  children = "Book now",
}: BookNowLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvent("book_now_click", { source })}
    >
      {children}
    </Link>
  );
}
