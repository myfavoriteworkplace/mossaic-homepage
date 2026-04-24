type Props = { size?: number };

export default function Logo({ size = 18 }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size}>
      <path
        d="M3 16V6l7 7 7-7v10"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
