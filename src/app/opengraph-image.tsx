import { ogContentType, ogSize, renderSiteOg } from "./lib/og";
import { site } from "./lib/site";

export const alt = `${site.name}, ${site.role}: development, character animations, playable ad and marketing videos`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderSiteOg();
}
