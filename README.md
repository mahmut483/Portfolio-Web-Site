# Portfolio

Video portfolio built with Next.js 16 (App Router, Tailwind 4).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Pages

| Route | Content |
|---|---|
| `/` | Work cards with looping previews (`public/media/previews/<name>.mp4` + `.jpg`), listed in `src/app/lib/site.ts` → `work` |
| `/development` | Pirates Match: Unity WebGL build (`public/media/match3/game/`) + videos, and the Brew Games case (`public/media/gearbag/`) |
| `/character-animations` | Videos from `public/media/charanim/` |
| `/marketing-videos` | Videos from `public/media/reels/` |
| `/playable-ad` | Playable ad (`public/media/playablead/playablead.html`), loads when "Play" is pressed |
| `/cv`, `/contact` | CV and contact details, from `site` in `src/app/lib/site.ts` |

Old paths (`/match3`, `/charanim`, `/playablead`, `/reels`) redirect permanently to the new ones (`next.config.ts`).

Each video's poster is the `.jpg` with the same name next to the `.mp4`.

Files under `/media` are cached by browsers for a day (`next.config.ts`). When replacing a file in place,
visitors may see the old version for up to a day; rename it (e.g. `-v2`) to update immediately.

## Adding a video

To play in every browser and start quickly, add videos as H.264 + AAC `.mp4` with `faststart` at a reasonable size
(`.mov` / PCM audio does not play in Firefox; GitHub rejects files over 100 MB):

```bash
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -vf "scale='min(1080,iw)':-2" \
  -c:a aac -b:a 160k -movflags +faststart output.mp4
ffmpeg -i output.mp4 -frames:v 1 -vf "scale='min(960,iw)':-2" -q:v 4 output.jpg   # poster frame
```

Then add it to the page's `videos` list as `src` and `poster`.

## Updating the Unity WebGL build

Export with gzip compression and the decompression fallback enabled, then replace
`public/media/match3/game/Build/`. `next.config.ts` serves `*.unityweb` with `Content-Encoding: gzip`
(and `.wasm.unityweb` as `application/wasm`), so the file names must keep the `.unityweb` suffix.
