import React from "react";

export function Separator({
  orientation = "horizontal",
  className = "",
  ...props
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="none"
      className={`shrink-0 bg-border ${
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"
      } ${className}`}
      {...props}
    />
  );
}
