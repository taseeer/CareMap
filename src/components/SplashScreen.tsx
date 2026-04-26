import { HeartPulse } from "lucide-react";

export function SplashScreen({ hiding }: { hiding?: boolean }) {
  return (
    <div
      className={[
        "fixed inset-0 z-[100] flex items-center justify-center",
        "transition-opacity duration-300",
        hiding ? "opacity-0 pointer-events-none" : "opacity-100",
      ].join(" ")}
      style={{ background: "var(--gradient-primary)" }}
      aria-label="CareMap loading screen"
    >
      <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%)" }} />

      <div className="relative text-center px-6">
        <div className="mx-auto mb-6 relative h-20 w-20 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-white/20 animate-splash-ring" />
          <span className="absolute inset-2 rounded-full bg-white/15" />
          <div className="relative h-16 w-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center animate-splash-heartbeat shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            <HeartPulse className="h-9 w-9 text-white" />
          </div>
        </div>

        <div className="text-white">
          <div className="text-4xl sm:text-5xl font-bold tracking-tight animate-splash-fadeInUp [animation-delay:80ms] [animation-fill-mode:backwards]">
            CareMap
          </div>
          <div className="mt-2 text-sm sm:text-base font-medium text-white/90 animate-splash-fadeInUp [animation-delay:180ms] [animation-fill-mode:backwards]">
            Healthcare Intelligence for India
          </div>
          <div className="mt-3 text-xs sm:text-sm text-white/85 max-w-xl mx-auto animate-splash-fadeInUp [animation-delay:280ms] [animation-fill-mode:backwards]">
            Mapping medical deserts across 1.4 billion lives
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/90 animate-splash-dots [animation-delay:0ms]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/90 animate-splash-dots [animation-delay:120ms]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/90 animate-splash-dots [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}

