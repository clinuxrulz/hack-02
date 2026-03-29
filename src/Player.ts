import { type Accessor, createEffect, createSignal,  onCleanup, type Signal } from "solid-js";
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
        renderMelty({
          target,
          position: position[0],
        });
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
  position: Accessor<THREE.Vector3>,
}) {
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshNormalMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  createEffect(params.position, (p) => {
    mesh.position.copy(p);
    mesh.position.y += 0.25;
  });
  params.target.add(mesh);
  onCleanup(() => {
    params.target.remove(mesh);
    geometry.dispose();
    material.dispose();
  });
}
