import Image from "next/image";

type Props = { images: { src: string; alt: string }[] };

export function CaseGallery({ images }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 my-8">
      {images.map((img) => (
        <div key={img.src} className="relative aspect-video">
          <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="50vw" />
        </div>
      ))}
    </div>
  );
}
