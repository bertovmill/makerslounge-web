// Regenerates the QR codes on the "Stay in touch" slide (#stay-in-touch).
//   node scripts/generate-stay-in-touch-qrs.mjs
import { writeFileSync } from "node:fs";
import QRCode from "qrcode";

const targets = [
  {
    out: "public/images/qr-tmu-cyber-summit.svg",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSdTXJmwg4CDZouFuuRKnW73MgkD35Jf0kDWm0RCjySXCTE1IA/viewform",
  },
  {
    out: "public/images/qr-makerslounge-calendar.svg",
    url: "https://luma.com/calendar/manage/cal-FGHayLJ6ZAmkYJi",
  },
];

for (const { out, url } of targets) {
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#0f1724", light: "#ffffff" },
  });
  writeFileSync(out, svg);
  console.log(`Wrote ${out} for ${url}`);
}
