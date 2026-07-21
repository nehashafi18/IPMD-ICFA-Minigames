interface Props {
  muted: boolean;
  className?: string;
}

export default function SpeakerIcon({ muted, className = 'w-4 h-4' }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 9.5v5h3.5l4.5 4V5.5l-4.5 4H4Z"
        fill="currentColor"
      />
      {muted ? (
        <path
          d="M16 9l5 6M21 9l-5 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M16.2 8.2a5 5 0 0 1 0 7.6M18.8 6a8.5 8.5 0 0 1 0 12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}
