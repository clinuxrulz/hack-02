import { type Accessor, createEffect, createSignal } from "solid-js";
import * as THREE from "three";

export function Ball(params: {
  position: Accessor<THREE.Vector3>,
  size: Accessor<number>,
}): {} {
  let position = createSignal(params.position);
  let render = (target: THREE.Object3D) => {
    let geometry = new THREE.SphereGeometry(params.size());
    let material = new THREE.MeshNormalMaterial();
    let mesh = new THREE.Mesh(geometry, material);
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
