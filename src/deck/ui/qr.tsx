import { QRCodeSVG } from "qrcode.react";

type LocalQrProps = {
  value: string;
  label: string;
  size?: number;
};

/**
 * Renders an accessible, automatically-sized QR code with a four-module quiet zone.
 */
export function LocalQr({ value, label, size = 128 }: LocalQrProps) {
  return (
    <span className="deck-qr" role="img" aria-label={`QR code for ${label}`}>
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={4}
        shapeRendering="crispEdges"
        aria-hidden="true"
      />
    </span>
  );
}
