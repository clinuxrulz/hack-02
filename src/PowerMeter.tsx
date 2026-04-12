import { createMemo, type Accessor, type Component } from "solid-js";

export function PowerMeter(params: {
  position: Accessor<{ x: number, y: number }>,
  width: Accessor<number>,
  height: Accessor<number>,
  power: Accessor<number>,
}): {
  position: Accessor<{ x: number, y: number }>,
  UI: Component,
} {
  const UI: Component = () => {
    return (
      <div
        style={{
          position: "absolute",
          left: `${params.position().x}px`,
          top: `${params.position().y}px`,
          width: `${params.width()}px`,
          height: `${params.height()}px`,
          "background-color": "rgba(0, 0, 0, 0.5)",
          border: "2px solid rgba(255, 255, 255, 0.8)",
          "border-radius": "4px",
          overflow: "hidden",
          "user-select": "none",
          "touch-action": "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "0px",
            bottom: "0px",
            width: "100%",
            height: `${params.power() * 100}%`,
            background: "linear-gradient(to top, #00ff00, #ffff00, #ff0000)",
            transition: "height 0.05s",
          }}
        />
      </div>
    );
  };

  return {
    position: params.position,
    UI,
  };
}