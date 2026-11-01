"use client";

import Link from "next/link";
import { Copy, Download, Images, Shapes } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { LOGO_MARKS, SOCIAL_ASSETS, type BrandAsset } from "@/lib/brand-assets";

async function copyLogoSvg() {
  try {
    const svg = await fetch("/logos/logo.svg").then((r) => r.text());
    await navigator.clipboard.writeText(svg);
  } catch {
    // Clipboard can be blocked (insecure origin, denied permission); the
    // download rows below still work, so fail quietly.
  }
}

function AssetItem({ asset }: { asset: BrandAsset }) {
  return (
    <ContextMenuItem asChild>
      <a href={asset.href} download={asset.filename}>
        <Download />
        {asset.label}
        <ContextMenuShortcut>{asset.format}</ContextMenuShortcut>
      </a>
    </ContextMenuItem>
  );
}

/**
 * Wrap any MakersLounge logo with this: right-clicking it (long-press on
 * touch) opens a menu of logo downloads instead of the browser's own menu,
 * the way Vercel and Linear do it. A left click still follows the logo link.
 */
export default function LogoContextMenu({ children }: { children: React.ReactNode }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-60">
        <ContextMenuLabel>MakersLounge logo</ContextMenuLabel>
        <ContextMenuItem onSelect={copyLogoSvg}>
          <Copy />
          Copy logo as SVG
        </ContextMenuItem>
        <ContextMenuSeparator />
        {LOGO_MARKS.map((asset) => (
          <AssetItem key={asset.href} asset={asset} />
        ))}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Images />
            Profiles and banners
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-60">
            {SOCIAL_ASSETS.map((asset) => (
              <AssetItem key={asset.href} asset={asset} />
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem asChild>
          <Link href="/#logo-downloads">
            <Shapes />
            All brand assets
          </Link>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
