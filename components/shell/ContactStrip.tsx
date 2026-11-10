type Props = {
  className?: string;
  /** "button": outlined buttons (case footer). "chip": smaller and lighter,
   *  for sitting under the name on the homepage without competing with the
   *  case title and its "See full case" button. */
  variant?: "button" | "chip";
};

const iconClass = "h-3.5 w-3.5 shrink-0";

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={iconClass}>
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={iconClass}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={iconClass}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.061 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

// Outlined controls that fill white on hover, so the contacts read as things
// to press, not text. The button is a smaller cousin of the stage's "See full
// case" button; the chip is lighter still: thinner, dimmer outline, tighter.
const BASE =
  "inline-flex cursor-pointer items-center whitespace-nowrap bg-transparent leading-none text-white transition-[background-color,color,border-color,transform] duration-200 ease-out hover:border-white hover:bg-white hover:text-[var(--color-ink)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-colors";
const VARIANT = {
  button: `${BASE} gap-2 border border-white/60 px-4 py-3 font-display text-sm font-bold md:px-3 md:py-2`,
  chip: `${BASE} gap-1.5 border border-white/35 bg-[#0E0E0E]/70 p-[14px] font-body text-xs md:px-2.5 md:py-1.5`,
};
// Chip labels show from md up; on phones the chips are icon-only squares.
const CHIP_LABEL = "hidden md:inline";

export function ContactStrip({ className, variant = "button" }: Props) {
  const BUTTON = VARIANT[variant];
  const label = variant === "chip" ? CHIP_LABEL : undefined;
  return (
    <nav aria-label="Contact" className={className}>
      <ul className={`m-0 flex list-none flex-wrap p-0 md:flex-nowrap ${variant === "chip" ? "gap-1.5" : "gap-2"}`}>
        <li>
          <a href="tel:+48572161197" className={BUTTON} aria-label="Phone">
            <PhoneIcon />
            <span className={label}>phone</span>
          </a>
        </li>
        <li>
          <a
            href="https://www.linkedin.com/in/hlib-didkovskyi-007518258/"
            target="_blank"
            rel="noopener noreferrer"
            className={BUTTON}
            aria-label="LinkedIn"
          >
            <LinkedInIcon />
            <span className={label}>linkedin</span>
          </a>
        </li>
        <li>
          <a
            href="https://t.me/petroproseko_contact"
            target="_blank"
            rel="noopener noreferrer"
            className={BUTTON}
            aria-label="Telegram"
          >
            <TelegramIcon />
            <span className={label}>telegram</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
