import React, { memo } from "react";
import Link from "next/link";

interface LogoProps {
  height?: number;
  linked?: boolean;
  className?: string;
}

function LogoComponent({
  height = 42,
  linked = true,
  className = "",
}: LogoProps) {
  const logo = (
    <div className={`inline-flex items-center justify-center ${className}`} style={{ width: height * 2.5, height }}>
      <img
        src="/light_logo.jpeg"
        alt="ODFE Cafe"
        style={{ height: `${height}px`, width: "auto" }}
        className="mix-blend-multiply scale-[3] pointer-events-none"
        draggable={false}
      />
    </div>
  );

  if (linked) {
    return (
      <Link href="/" className="inline-flex items-center">
        {logo}
      </Link>
    );
  }

  return logo;
}

export const Logo = memo(LogoComponent);
export default Logo;
