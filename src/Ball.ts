import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import * as THREE from "three";

export function Ball(params: {
  position: Accessor<THREE.Vector3>,
  size: Accessor<number>,
}): {
  render: (target: THREE.Object3D) => void,
  update: (dt: number) => void,
} {
  let position = createSignal(params.position, undefined, { equals: false, });
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
  let update = (dt: number) => {
    position[1]((x) => x.addScalar(0.01)); /*new THREE.Vector3().copy(x).addScalar(0.01));*/
  };
  return {
    render,
    update,
  };
}
