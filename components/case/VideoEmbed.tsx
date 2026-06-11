type Props = { src: string; poster?: string };

export function VideoEmbed({ src, poster }: Props) {
  return (
    <div className="my-8 w-full">
      <video
        src={src}
        poster={poster}
        controls
        playsInline
        className="w-full rounded-sm"
      />
    </div>
  );
}
