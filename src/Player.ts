import { type Accessor, createSignal, type Signal } from "solid-js";
import * as THREE from "three";

type PlayerType =
  | "Cubey"
  | "Melty";

export function Player(params: {
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  playerType: PlayerType,
}): {
  position: Signal<THREE.Vector3>,
  velocity: Signal<THREE.Vector3>,
  render: (target: THREE.Object3D) => void,
} {
  let position = createSignal(params.position);
  let velocity = createSignal(params.velocity);
  let render = (target: THREE.Object3D) => {
    switch (params.playerType) {
      case "Cubey":
      case "Melty":
        renderMelty
    }
  };
  return {
    position,
    velocity,
    render,
  };
}

function renderMelty(params: {
  target: THREE.Object3D,
  position: Accessor<THREE.Object3D>,
}) {}
