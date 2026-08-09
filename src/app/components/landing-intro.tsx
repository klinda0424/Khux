import { useEffect } from "react";
import { ParticleText } from "./particle-text/ParticleText";

const GATHER_DURATION = 900;
const NUDGE_DELAY = GATHER_DURATION + 500;
const NUDGE_DISTANCE = 140;

export function LandingIntro() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // 사용자가 이미 스스로 스크롤했다면 끼어들지 않음
      if (window.scrollY < 10) {
        window.scrollBy({ top: NUDGE_DISTANCE, behavior: "smooth" });
      }
    }, NUDGE_DELAY);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[75vh] w-full flex items-center justify-center overflow-hidden">
      <ParticleText
        text="KHUX"
        trigger="mount"
        color="#ffffff"
        highlightColor="#00e6a8"
        particleSize={2.4}
        density={3}
        scatter={160}
        gatherDuration={GATHER_DURATION}
        stagger={280}
        idleDrift={0.5}
        fontSize="clamp(3.5rem, 16vw, 9rem)"
        fontWeight={900}
        style={{ width: "min(90vw, 640px)", height: "min(40vh, 240px)" }}
      />
    </section>
  );
}
