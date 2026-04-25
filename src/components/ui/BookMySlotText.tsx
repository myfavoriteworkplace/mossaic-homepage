type Props = {
  className?: string;
};

export default function BookMySlotText({ className = "" }: Props) {
  return (
    <span className={`font-bold tracking-tight whitespace-nowrap ${className}`}>
      <span className="text-ink">book</span>
      <span className="text-moss">My</span>
      <span className="text-ink">Slot</span>
    </span>
  );
}
