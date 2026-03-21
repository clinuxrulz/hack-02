import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import * as THREE from "three";

export function Ball(params: {
  position: Accessor<THREE.Vector3>,
  size: Accessor<number>,
}): {
  render: (target: THREE.Object3D) => void,
} {
  let position = createSignal(params.position);
  let render = (target: THREE.Object3D) => {
    let geometry = new THREE.SphereGeometry(params.size());
    let material = new THREE.MeshNormalMaterial();
    let mesh = new THREE.Mesh(geometry, material);
    target.add(mesh);
    onCleanup(() => {
      target.remove(mesh);
    });
    createEffect(
      position[0],
      (position) => {
        mesh.position.copy(position);
      },
    );
  };
  
  return {
    render,
  };
}
