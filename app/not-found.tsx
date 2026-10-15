import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-[var(--space-gutter)] text-center">
      <p className="font-body text-sm text-[var(--color-ink-soft)] mb-4">404</p>
      <h1 className="font-display text-4xl md:text-5xl leading-tight mb-6">
        the wheel doesn&apos;t spin to nowhere
      </h1>
      <Link href="/" className="font-body text-sm underline hover:text-[var(--color-ink-soft)]">
        ← back to the wheel
      </Link>
    </div>
  );
}
