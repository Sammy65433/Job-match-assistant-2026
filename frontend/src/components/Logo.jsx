import { SVG3D } from "3dsvg";

export default function Logo() {
  return (
    <div className="app-logo" style={{ width: 260, height: 90 }}>
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