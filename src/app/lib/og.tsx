import { readFile } from "node:fs/promises";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getWork, site, work, type WorkSlug } from "./site";

// Share images (Open Graph / Twitter), rendered at build time.
// ImageResponse only outputs PNG, and PNGs with photos run past WhatsApp's ~300 KB preview limit,
// so the PNG is re-encoded as JPEG.

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/jpeg";

const color = {
  night: "#081f01",
  panel: "#0d2802",
  ink: "#eef1f6",
  mist: "#9aa4b6",
  line: "rgba(226,232,240,0.14)",
};

const host = new URL(site.url).host;

// Files are referenced relative to this module (import.meta.url), not process.cwd():
// a cwd-based path makes the file tracer copy the whole project, public/ videos included,
// into every server function.
async function fonts() {
  const [medium, semibold] = await Promise.all([
    readFile(new URL("../fonts/HankenGrotesk-500.ttf", import.meta.url)),
    readFile(new URL("../fonts/HankenGrotesk-600.ttf", import.meta.url)),
  ]);
  return [
    { name: "Hanken Grotesk", data: medium, weight: 500 as const, style: "normal" as const },
    { name: "Hanken Grotesk", data: semibold, weight: 600 as const, style: "normal" as const },
  ];
}

// One literal readFile per poster: a readFile on a variable path makes the tracer give up
// and bundle the entire project.
const readPoster: Record<WorkSlug, () => Promise<Buffer>> = {
  development: () => readFile(new URL("../../../public/media/previews/match3.jpg", import.meta.url)),
  "character-animations": () =>
    readFile(new URL("../../../public/media/previews/charanim.jpg", import.meta.url)),
  "playable-ad": () => readFile(new URL("../../../public/media/previews/playablead.jpg", import.meta.url)),
  "marketing-videos": () => readFile(new URL("../../../public/media/previews/reels.jpg", import.meta.url)),
};

async function posterDataUri(slug: WorkSlug) {
  const file = await readPoster[slug]();
  return `data:image/jpeg;base64,${file.toString("base64")}`;
}

async function toJpeg(image: ImageResponse) {
  const png = Buffer.from(await image.arrayBuffer());
  const jpeg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Uint8Array(jpeg);
}

function jpegResponse(bytes: Uint8Array) {
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": ogContentType } });
}

function Badge() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: color.ink,
        color: color.night,
        fontSize: 30,
        fontWeight: 600,
        letterSpacing: "-1.5px",
      }}
    >
      MK
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: color.night,
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        color: color.ink,
        fontFamily: "Hanken Grotesk",
        padding: 56,
      }}
    >
      {children}
    </div>
  );
}

function Card({ src, label, width, height }: { src: string; label?: string; width: number; height: number }) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width,
        height,
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${color.line}`,
        backgroundColor: color.panel,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
      <img src={src} alt="" width={width} height={height} style={{ objectFit: "cover", objectPosition: "top" }} />
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            padding: "48px 18px 16px",
            backgroundImage: "linear-gradient(to bottom, rgba(8,31,1,0), rgba(8,31,1,0.92))",
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}

// Reading files counts as uncached I/O under Cache Components, so the rendering lives in
// "use cache" helpers: the images are then prerendered at build time instead of per request.

// Home / default: name, role and the four work previews
export async function renderSiteOg() {
  return jpegResponse(await siteOgBytes());
}

async function siteOgBytes() {
  "use cache";
  cacheLife("max");
  const posters = await Promise.all(work.map((w) => posterDataUri(w.slug)));
  const cardWidth = (ogSize.width - 56 * 2 - 18 * 3) / 4;

  return toJpeg(
    new ImageResponse(
      (
        <Frame>
          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <Badge />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 54, fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1.05 }}>
                    {site.name}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 500, color: color.mist, marginTop: 6 }}>{site.role}</div>
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, color: color.mist }}>{host}</div>
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 40 }}>
              {work.map((w, i) => (
                <Card key={w.slug} src={posters[i]} label={w.title} width={cardWidth} height={340} />
              ))}
            </div>
          </div>
        </Frame>
      ),
      { ...ogSize, fonts: await fonts() },
    ),
  );
}

// Work pages: page title and description next to that work's preview
export async function renderWorkOg(slug: WorkSlug) {
  return jpegResponse(await workOgBytes(slug));
}

async function workOgBytes(slug: WorkSlug) {
  "use cache";
  cacheLife("max");
  const item = getWork(slug);
  const poster = await posterDataUri(slug);

  return toJpeg(
    new ImageResponse(
      (
        <Frame>
          <div style={{ display: "flex", width: "100%", gap: 56 }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Badge />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 28, fontWeight: 600 }}>{site.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 500, color: color.mist }}>{site.role}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: "-2.5px", lineHeight: 1 }}>{item.title}</div>
                <div style={{ fontSize: 27, fontWeight: 500, color: color.mist, marginTop: 22, lineHeight: 1.35 }}>
                  {item.description}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, color: color.mist }}>{`${host}/${slug}`}</div>
            </div>
            <Card src={poster} width={291} height={518} />
          </div>
        </Frame>
      ),
      { ...ogSize, fonts: await fonts() },
    ),
  );
}
