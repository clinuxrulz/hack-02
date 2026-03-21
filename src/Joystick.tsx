import { createSignal, createMemo, type Accessor, type Component, type Signal } from "solid-js";
import * as THREE from "three";

namespace Joystick {
  export type Params = {
    position: THREE.Vector2 | Accessor<THREE.Vector2>,
    hitAreaSize: number | Accessor<number>,
    outerRingSize: Accessor<number>,
    knobSize: Accessor<number>,
  };
}

export class Joystick {
  position: Signal<THREE.Vector2>;
  hitAreaSize: Signal<number>;
  outerRingSize: Signal<number>;
  knobSize: Signal<number>;
  dragOffset: Signal<THREE.Vector2 | undefined>;
  value: Accessor<THREE.Vector2>;

  constructor(params: Joystick.Params) {
    if (typeof params.position == "function") {
      this.position = createSignal(params.position);
    } else {
      this.position = createSignal(params.position);
    }
    if (typeof params.hitAreaSize == "function") {
      this.hitAreaSize = createSignal(params.hitAreaSize);
    } else {
      this.hitAreaSize = createSignal(params.hitAreaSize);
    }
    this.outerRingSize = createSignal(params.outerRingSize);
    this.knobSize = createSignal(params.knobSize);
    this.dragOffset = createSignal();
    this.value = createMemo(() => {
      let dragOffset2 = this.dragOffset[0]();
      if (dragOffset2 == undefined) {
        return new THREE.Vector2();
      }
      return new THREE.Vector2().copy(dragOffset2).multiplyScalar(1.0 / this.outerRingSize[0]());
    });
  }

  UI: Component = () => {
    let [ dragging, setDragging, ] = createSignal(false);
    let [ startPos, setStartPos, ] = createSignal<THREE.Vector2>();
    let [ dragOffset, setDragOffset, ] = this.dragOffset;
    let [ hitDiv, setHitDiv, ] = createSignal<HTMLDivElement>();
    let dragPointerId: number | undefined = undefined;
    let hitAreaOnPointerDown = (e: PointerEvent) => {
      let div = hitDiv();
      if (div == undefined) {
        return;
      }
      dragPointerId = e.pointerId;
      div.setPointerCapture(dragPointerId);
      let rect = div.getBoundingClientRect();
      setStartPos(new THREE.Vector2(
        e.clientX - rect.left,
        e.clientY - rect.top,
      ));
      setDragOffset(new THREE.Vector2());
    };
    let hitAreaOnPointerMove = (e: PointerEvent) => {
      let div = hitDiv();
      if (div == undefined) {
        return;
      }
      let startPos2 = startPos();
      if (startPos2 == undefined) {
        return;
      }
      div.setPointerCapture(e.pointerId);
      let rect = div.getBoundingClientRect();
      let offset = new THREE.Vector2(
        e.clientX - rect.left - startPos2.x,
        e.clientY - rect.top - startPos2.y,
      );
      let len = offset.length();
      if (len > 0.5 * this.outerRingSize[0]()) {
        offset.multiplyScalar(0.5 * this.outerRingSize[0]() / len);
      }
      setDragOffset(offset);
    };
    let hitAreaOnPointerUp = (e: PointerEvent) => {
      let div = hitDiv();
      if (div == undefined) {
        return;
      }
      if (dragPointerId == undefined) {
        return;
      }
      setStartPos(undefined);
      setDragOffset(undefined);
    };
    return (
      <div
        ref={setHitDiv}
        style={{
          "position": "absolute",
          "left": `${this.position[0]().x}px`,
          "top": `${this.position[0]().y}px`,
          "width": `${this.hitAreaSize[0]()}px`,
          "height": `${this.hitAreaSize[0]()}px`,
          "user-select": "none",
          "touch-action": "none",
          //"background-color": "red",
        }}
        onPointerDown={hitAreaOnPointerDown}
        onPointerMove={hitAreaOnPointerMove}
        onPointerUp={hitAreaOnPointerUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          style={{
            "position": "absolute",
            "left": `${startPos()?.x ?? 0.5 * this.hitAreaSize[0]()}px`,
            "top": `${startPos()?.y ?? 0.5 * this.hitAreaSize[0]()}px`,
            "transform": "translate(-50%, -50%)",
            "width": `${this.outerRingSize[0]()}px`,
            "height": `${this.outerRingSize[0]()}px`,
            "border-radius": `${0.5 * this.outerRingSize[0]() + 2.5}px`,
            "border": "5px solid white"
          }}
        >
          <div
            style={{
              "position": "absolute",
              "left": `${0.5 * this.outerRingSize[0]() + (dragOffset()?.x ?? 0.0)}px`,
              "top": `${0.5 * this.outerRingSize[0]() + (dragOffset()?.y ?? 0.0)}px`,
              "transform": "translate(-50%,-50%)",
              "width": `${this.knobSize[0]()}px`,
              "height": `${this.knobSize[0]()}px`,
              "border-radius": `${0.5 * this.knobSize[0]()}px`,
              "background-color": "rgba(255,255,255,0.5)",
            }}
          >
          </div>
        </div>
      </div>
    );
  };
}
