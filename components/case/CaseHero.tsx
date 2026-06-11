import Image from "next/image";

type Props = { image: string; caption?: string };

export function CaseHero({ image, caption }: Props) {
  return (
    <figure className="my-8 -mx-[var(--space-gutter)]">
      <div className="relative w-full aspect-video">
        <Image src={image} alt={caption ?? ""} fill className="object-cover" sizes="100vw" />
      </div>
      {caption && (
        <figcaption className="text-xs font-body text-[var(--color-ink-soft)] mt-2 px-[var(--space-gutter)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
