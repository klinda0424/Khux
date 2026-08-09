import { useEffect, useState } from "react";
import { ParticleText } from "./particle-text/ParticleText";

const SESSION_KEY = "khux_intro_seen";
const HOLD_MS = 900;
const FADE_MS = 350;

export function LandingIntro() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SESSION_KEY);
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    document.body.style.overflow = "hidden";

    const fadeTimer = setTimeout(() => setFading(true), HOLD_MS);
    const removeTimer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setVisible(false);
      document.body.style.overflow = "";
    }, HOLD_MS + FADE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background transition-opacity duration-[350ms] ease-out"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <ParticleText
        text="KHUX"
        trigger="mount"
        color="#ffffff"
        highlightColor="#00e6a8"
        particleSize={2.4}
        density={3}
        scatter={160}
        gatherDuration={600}
        stagger={220}
        idleDrift={0.5}
        fontSize="clamp(3.5rem, 16vw, 9rem)"
        fontWeight={900}
        style={{ width: "min(90vw, 640px)", height: "min(40vh, 240px)" }}
      />
    </div>
  );
}
