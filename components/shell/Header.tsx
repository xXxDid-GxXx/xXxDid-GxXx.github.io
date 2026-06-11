type Props = { className?: string };

export function Header({ className }: Props) {
  return (
    <header className={className}>
      <h1 className="font-display text-4xl leading-none">Hlib Didkovskyi</h1>
      <p className="font-body text-base text-[var(--color-ink-soft)] mt-1">
        Senior Product Designer · AI-first workflows
      </p>
    </header>
  );
}
