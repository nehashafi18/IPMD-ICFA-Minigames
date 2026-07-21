interface Card {
  image: string;
  label: string;
  description: string;
}

interface CardButtonProps {
  card: Card;
  onClick: () => void;
}

export default function CardButton({
  card,
  onClick,
}: CardButtonProps) {
  return (
    <button
      className="imageCadonrd"
      onClick={onClick}
    >
      <img src={card.image} alt={card.label} />

      <div className="cardOverlay">
        <p>{card.description}</p>
      </div>

      <span className="cardName">{card.label}</span>
    </button>
  );
}