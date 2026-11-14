import { ogContentType, ogSize, renderWorkOg } from "../../lib/og";
import { getWork, site } from "../../lib/site";

export const alt = `${getWork("development").title} by ${site.name}`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderWorkOg("development");
}
