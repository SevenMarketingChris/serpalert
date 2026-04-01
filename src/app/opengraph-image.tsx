import { ImageResponse } from "next/og";

export const alt = "SerpAlert social preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0b1120 0%, #101828 50%, #0f766e 100%)",
          color: "#f8fafc",
          padding: "56px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: "flex",
              height: 18,
              width: 18,
              borderRadius: 9999,
              background: "#34d399",
            }}
          />
          SerpAlert
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.02,
            }}
          >
            <div>Stop paying for clicks</div>
            <div>you already own</div>
          </div>
          <div
            style={{
              maxWidth: 920,
              fontSize: 30,
              lineHeight: 1.35,
              color: "#cbd5e1",
            }}
          >
            Hourly Google SERP monitoring, screenshot evidence, and alerts when
            competitors bid on your brand.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "18px",
            fontSize: 24,
            color: "#a7f3d0",
          }}
        >
          <span>Hourly checks</span>
          <span>Screenshot proof</span>
          <span>Slack alerts</span>
        </div>
      </div>
    ),
    size
  );
}
