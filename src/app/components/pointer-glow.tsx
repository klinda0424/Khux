import { useEffect, useRef } from "react";

export function PointerGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;

    const handleMove = (e: MouseEvent) => {
      el.style.setProperty("--glow-x", `${e.clientX}px`);
      el.style.setProperty("--glow-y", `${e.clientY}px`);
      el.style.opacity = "1";
    };
    const handleLeave = () => {
      el.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMove);
    document.documentElement.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] opacity-0 transition-opacity duration-300"
      style={{
        background:
          "radial-gradient(600px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(0, 230, 168, 0.16), transparent 70%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
