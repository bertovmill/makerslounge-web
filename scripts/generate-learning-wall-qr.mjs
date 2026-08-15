// Regenerates the "What are you here to learn?" QR code.
//   node scripts/generate-learning-wall-qr.mjs [url]
// The default URL opens the deck with the wall panel already expanded.
import { writeFileSync } from "node:fs";
import QRCode from "qrcode";

const url = process.argv[2] ?? "https://eve.makerslounge.ca/?wall=open#attendees";
const out = "public/images/learning-wall-qr.svg";

const svg = await QRCode.toString(url, {
  type: "svg",
  errorCorrectionLevel: "M",
  margin: 1,
  width: 512,
  color: { dark: "#0f1724", light: "#ffffff" },
});

writeFileSync(out, svg);
console.log(`Wrote ${out} for ${url}`);
