import { ParticleText } from "./particle-text/ParticleText";

export function LandingIntro() {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <ParticleText
        text="KHUX"
        trigger="mount"
        color="#ffffff"
        highlightColor="#00e6a8"
        particleSize={2.4}
        density={3}
        scatter={160}
        gatherDuration={900}
        stagger={280}
        idleDrift={0.5}
        fontSize="clamp(3.5rem, 16vw, 9rem)"
        fontWeight={900}
        style={{ width: "min(90vw, 640px)", height: "min(40vh, 240px)" }}
      />
    </section>
  );
}
