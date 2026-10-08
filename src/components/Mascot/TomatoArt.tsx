/** Placeholder único (G-Q16): mesma arte para todo estado — só a animação e a fala mudam. */
export function TomatoArt() {
  return (
    <svg viewBox="0 0 120 120" width="88" height="88" aria-hidden="true">
      <path d="M52 14c6-10 20-10 24-2-6 2-14 6-18 12z" fill="#2E7D4F" />
      <path d="M58 16c4-8 14-10 20-6-4 4-10 8-14 12z" fill="#3C9A61" />
      <circle cx="60" cy="68" r="42" fill="#FF5E5B" />
      <circle cx="60" cy="68" r="42" fill="url(#tomatoShine)" opacity="0.5" />
      <circle cx="44" cy="62" r="6" fill="#2E243D" />
      <circle cx="76" cy="62" r="6" fill="#2E243D" />
      <circle cx="46" cy="60" r="1.6" fill="#fff" />
      <circle cx="78" cy="60" r="1.6" fill="#fff" />
      <path d="M46 80q14 12 28 0" stroke="#2E243D" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="76" r="6" fill="#FFA45B" opacity="0.55" />
      <circle cx="86" cy="76" r="6" fill="#FFA45B" opacity="0.55" />
      <defs>
        <radialGradient id="tomatoShine" cx="38%" cy="32%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}
