import { ogContentType, ogSize, renderSiteOg } from "../../lib/og";
import { site } from "../../lib/site";

// Same share image as the home page: a page-level openGraph object drops the inherited one
export const alt = `${site.name}, ${site.role}`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderSiteOg();
}
