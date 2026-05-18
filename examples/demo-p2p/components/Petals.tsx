"use client";
import { useMemo } from "react";

const COUNT = 12;

export function Petals() {
  const petals = useMemo(
    () =>
      Array.from({ length: COUNT }).map((_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const rand = (n: number) => ((seed * (n + 1)) % 233280) / 233280;
        return {
          id: i,
          left: rand(1) * 100,
          delay: rand(2) * 30,
          duration: 18 + rand(3) * 22,
          size: 12 + rand(4) * 14,
          rot: 240 + rand(5) * 360,
          tx: (rand(6) - 0.5) * 200,
        };
      }),
    []
  );

  return (
    <>
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal"
          style={{
            left: `${p.left}vw`,
            width: p.size,
            height: p.size * 1.3,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--petal-tx" as string]: `${p.tx}px`,
            ["--petal-rot" as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </>
  );
}
