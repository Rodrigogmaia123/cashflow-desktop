"use client";

import { useEffect } from "react";

export function LandingEffects() {
  useEffect(() => {
    const reveals = document.querySelectorAll(".lp .reveal");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      reveals.forEach((el) => el.classList.add("in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.05, rootMargin: "120px 0px" }
    );
    reveals.forEach((node) => observer.observe(node));

    const counted = new WeakSet<Element>();
    const counters = document.querySelectorAll<HTMLElement>("[data-countup]");
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || counted.has(entry.target)) return;
          counted.add(entry.target);
          const el = entry.target as HTMLElement;
          const target = Number(el.getAttribute("data-countup") || 0);
          const prefix = el.getAttribute("data-prefix") || "";
          const started = performance.now();
          const duration = 900;
          const tick = (now: number) => {
            const progress = Math.min((now - started) / duration, 1);
            el.textContent = `${prefix}${Math.floor(progress * target)}`;
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = `${prefix}${target}`;
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((node) => countObserver.observe(node));

    const revealAllInView = () => {
      document.querySelectorAll(".lp .reveal").forEach((node) => node.classList.add("in"));
    };

    window.addEventListener("hashchange", revealAllInView);

    const fallback = window.setTimeout(revealAllInView, 1800);

    return () => {
      observer.disconnect();
      countObserver.disconnect();
      window.clearTimeout(fallback);
      window.removeEventListener("hashchange", revealAllInView);
    };
  }, []);

  return null;
}
