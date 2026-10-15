type Props = { className?: string };

export function Header({ className }: Props) {
  return (
    <header className={className}>
      <h1 className="font-display text-4xl font-bold leading-none">
        <span className="text-box">Hlib Didkovskyi</span>
      </h1>
      {/* One line when it fits; otherwise each role on its own line. The " · "
          lives at the start of the second role inside a 3ch strip. The row is
          shifted 3ch left inside a clipping wrapper, so when that role wraps
          the strip falls outside the clip — a wrapped line never starts with a
          stray dot. */}
      <p className="font-body text-base mt-2 leading-snug overflow-hidden w-max max-w-full text-[var(--color-ink-soft)]">
        <span className="flex flex-wrap -ml-[3ch]">
          <span className="text-box whitespace-nowrap ml-[3ch]">Product Designer</span>
          <span className="text-box whitespace-nowrap">
            <span aria-hidden className="inline-block w-[3ch] text-center">·</span>
            Product Owner
          </span>
        </span>
      </p>
    </header>
  );
}
