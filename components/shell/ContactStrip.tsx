type Props = { className?: string };

export function ContactStrip({ className }: Props) {
  return (
    <nav aria-label="Contact" className={className}>
      <ul className="flex gap-4 font-body text-sm list-none p-0 m-0">
        <li>
          <a href="tel:+380000000000" className="hover:underline">
            phone
          </a>
        </li>
        <li>
          <a
            href="https://linkedin.com/in/hlibdidkovskyi"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            linkedin
          </a>
        </li>
        <li>
          <a
            href="https://t.me/hlibdidkovskyi"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            telegram
          </a>
        </li>
      </ul>
    </nav>
  );
}
