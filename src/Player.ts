import * as THREE from "three";
import { createSignal, type Signal } from "solid-js";

export function Player(params: {
  position: THREE.Vector3,
  velocity: THREE.Vector3,
}): {
  position: Signal<THREE.Vector3>,
  velocity: Signal<THREE.Vector3>,
} {
  let position = createSignal(params.position);
  let velocity = createSignal(params.velocity);
  return {
    position,
    velocity,
  };
}
