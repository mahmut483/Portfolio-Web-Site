import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#081f01",
          borderRadius: "12px",
        }}
      >
        <span
          style={{
            fontSize: "46px",
            fontWeight: 900,
            color: "#eef1f6",
            letterSpacing: "-3.5px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, -apple-system, sans-serif",
            marginTop: "-2px",
          }}
        >
          MK
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
