import { useMemo } from "react";

const SIZE = 37;
const DATA_CODEWORDS = 108;
const ECC_CODEWORDS = 26;

function multiply(a: number, b: number) {
  let result = 0;
  for (let i = 7; i >= 0; i -= 1) {
    result = (result << 1) ^ ((result >>> 7) * 0x11d);
    result ^= ((b >>> i) & 1) * a;
  }
  return result & 0xff;
}

function reedSolomon(data: number[]) {
  let generator = [1];
  let root = 1;
  for (let i = 0; i < ECC_CODEWORDS; i += 1) {
    const next = new Array(generator.length + 1).fill(0) as number[];
    generator.forEach((coefficient, index) => {
      next[index] ^= coefficient;
      next[index + 1] ^= multiply(coefficient, root);
    });
    generator = next;
    root = multiply(root, 2);
  }
  const remainder = new Array(ECC_CODEWORDS).fill(0) as number[];
  data.forEach((byte) => {
    const factor = byte ^ remainder[0];
    for (let i = 0; i < ECC_CODEWORDS - 1; i += 1) {
      remainder[i] = remainder[i + 1] ^ multiply(generator[i + 1], factor);
    }
    remainder[ECC_CODEWORDS - 1] = multiply(generator[ECC_CODEWORDS], factor);
  });
  return remainder;
}

function qrMatrix(value: string) {
  const bytes = Array.from(new TextEncoder().encode(value));
  const capacity = DATA_CODEWORDS * 8 - 12;
  if (bytes.length * 8 > capacity) throw new Error("QR destination is too long for the local encoder.");

  const bits: number[] = [];
  const appendBits = (number: number, length: number) => {
    for (let index = length - 1; index >= 0; index -= 1) bits.push((number >>> index) & 1);
  };
  appendBits(0b0100, 4);
  appendBits(bytes.length, 8);
  bytes.forEach((byte) => appendBits(byte, 8));
  appendBits(0, Math.min(4, DATA_CODEWORDS * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  const data: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    data.push(bits.slice(index, index + 8).reduce((sum, bit) => (sum << 1) | bit, 0));
  }
  for (let pad = 0; data.length < DATA_CODEWORDS; pad += 1) data.push(pad % 2 === 0 ? 0xec : 0x11);
  const allCodewords = [...data, ...reedSolomon(data)];
  const codeBits = allCodewords.flatMap((byte) => Array.from({ length: 8 }, (_, i) => (byte >>> (7 - i)) & 1));

  const matrix = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false) as boolean[]);
  const functionCell = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false) as boolean[]);
  const setFunction = (x: number, y: number, dark: boolean) => {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    matrix[y][x] = dark;
    functionCell[y][x] = true;
  };

  const finder = (centerX: number, centerY: number) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const radius = Math.max(Math.abs(dx), Math.abs(dy));
        setFunction(centerX + dx, centerY + dy, radius !== 2 && radius <= 3);
      }
    }
  };
  finder(3, 3);
  finder(SIZE - 4, 3);
  finder(3, SIZE - 4);

  for (let i = 8; i < SIZE - 8; i += 1) {
    setFunction(6, i, i % 2 === 0);
    setFunction(i, 6, i % 2 === 0);
  }
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      setFunction(30 + dx, 30 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }

  // Reserve and then populate the two copies of the format information.
  const formatPositions: [number, number][] = [];
  for (let i = 0; i <= 5; i += 1) formatPositions.push([8, i]);
  formatPositions.push([8, 7], [8, 8], [7, 8]);
  for (let i = 9; i < 15; i += 1) formatPositions.push([14 - i, 8]);
  const secondFormat: [number, number][] = [];
  for (let i = 0; i < 8; i += 1) secondFormat.push([SIZE - 1 - i, 8]);
  for (let i = 8; i < 15; i += 1) secondFormat.push([8, SIZE - 15 + i]);
  [...formatPositions, ...secondFormat].forEach(([x, y]) => setFunction(x, y, false));
  setFunction(8, SIZE - 8, true);

  let bitIndex = 0;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < SIZE; vert += 1) {
      const upward = ((right + 1) & 2) === 0;
      const y = upward ? SIZE - 1 - vert : vert;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (!functionCell[y][x]) {
          const raw = bitIndex < codeBits.length ? codeBits[bitIndex] : 0;
          matrix[y][x] = Boolean(raw ^ Number((x + y) % 2 === 0));
          bitIndex += 1;
        }
      }
    }
  }

  let format = 0b01000; // Error correction level L, mask pattern 0.
  let remainder = format;
  for (let i = 0; i < 10; i += 1) remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537);
  format = ((format << 10) | remainder) ^ 0x5412;
  formatPositions.forEach(([x, y], index) => {
    setFunction(x, y, ((format >>> index) & 1) !== 0);
  });
  secondFormat.forEach(([x, y], index) => {
    setFunction(x, y, ((format >>> index) & 1) !== 0);
  });
  setFunction(8, SIZE - 8, true);
  return matrix;
}

export function LocalQr({ value, label }: { value: string; label: string }) {
  const matrix = useMemo(() => qrMatrix(value), [value]);
  const path = matrix.reduce((commands, row, y) => {
    row.forEach((dark, x) => {
      if (dark) commands.push(`M${x} ${y}h1v1h-1z`);
    });
    return commands;
  }, [] as string[]).join("");

  return (
    <span className="deck-qr" role="img" aria-label={`QR code for ${label}`}>
      <svg viewBox={`-4 -4 ${SIZE + 8} ${SIZE + 8}`} aria-hidden="true">
        <path fill="#030712" d={path} />
      </svg>
    </span>
  );
}
