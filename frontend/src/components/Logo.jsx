import { SVG3D } from "3dsvg";

export default function Logo({ width = 260, height = 90 }) {
  return (
    <div
      className="app-logo"
      role="img"
      aria-label="Job Match"
      style={{ width, height, maxWidth: "100%" }}
    >
      <SVG3D
        text="JOB MATCH"
        font="Oswald"
        smoothness={0.6}
        color="#4f46e5"
        animate="float"
      />
    </div>
  );
}