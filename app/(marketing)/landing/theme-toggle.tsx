"use client";

import { useState } from "react";

const COOKIE = "lp-theme";

export function ThemeToggle({ initial }: { initial: "dark" | "light" }) {
  const [theme, setTheme] = useState(initial);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.querySelector(".lp")?.setAttribute("data-theme", next);
    document.cookie = `${COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  const light = theme === "light";

  return (
    <button
      type="button"
      className="btn btn-ghost theme-toggle"
      onClick={toggle}
      aria-pressed={light}
    >
      {light ? "Tema escuro" : "Tema claro"}
    </button>
  );
}
