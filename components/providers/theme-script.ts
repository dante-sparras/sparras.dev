/**
 * Blocking FOUC script (runs before paint).
 * Keep in sync with ThemeProvider storage key / class attribute.
 */
export const THEME_STORAGE_KEY = "theme";

/** Inline IIFE applied to <html> before React hydrates. */
export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement,c=d.classList;c.remove("light","dark");var e=localStorage.getItem("${THEME_STORAGE_KEY}");var sys=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var t=(!e||e==="system")?sys:e;if(t==="light"||t==="dark"){c.add(t);d.style.colorScheme=t}}catch(e){}})();`;
