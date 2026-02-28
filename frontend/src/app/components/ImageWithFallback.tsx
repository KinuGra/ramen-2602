"use client";

import React, { useState } from "react";

const FALLBACK =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4K";

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [error, setError] = useState(false);
  const { src, alt, className, style, ...rest } = props;

  if (error || !src) {
    return (
      <div className={`inline-flex items-center justify-center bg-gray-100 ${className ?? ""}`} style={style}>
        <img src={FALLBACK} alt="fallback" className="w-1/2 h-1/2 opacity-40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
      {...rest}
    />
  );
}
