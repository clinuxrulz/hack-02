import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import * as THREE from "three";

export function Ball(params: {
  position: Accessor<THREE.Vector3>,
  size: Accessor<number>,
  boundary: Accessor<THREE.Box3>,
}): {
  render: (target: THREE.Object3D) => void,
  update: (dt: number) => void,
} {
  let position = createSignal(params.position, undefined, { equals: false, });
  let velocity = createSignal(new THREE.Vector3(1.0, 1.0, 1.0).multiplyScalar(0.002), { equals: false, });
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
    {
      let box = params.boundary();
      let geometry = new THREE.BoxGeometry(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
      let material = new THREE.MeshNormalMaterial({
        transparent: true,
        opacity: 0.5,
        side: THREE.BackSide,
      });
      let mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0.5 * (box.min.x + box.max.x), 0.5 * (box.min.y + box.max.y), 0.5 * (box.min.z + box.max.z));
      target.add(mesh);
      onCleanup(() => {
        target.remove(mesh);
      });
    }
  };
  let tmpV = new THREE.Vector3();
  let update = (dt: number) => {
    tmpV.copy(velocity[0]()).multiplyScalar(dt);
    let newPos = position[0]().add(tmpV);
    let newVel = velocity[0]();
    let b = params.boundary();
    if (newPos.x < b.min.x) {
      newVel.x = Math.abs(newVel.x);
    }
    if (newPos.x > b.max.x) {
      newVel.x = -Math.abs(newVel.x);
    }
    if (newPos.y < b.min.y) {
      newVel.y = Math.abs(newVel.y);
    }
    if (newPos.y > b.max.y) {
      newVel.y = -Math.abs(newVel.y);
    }
    if (newPos.z < b.min.z) {
      newVel.z = Math.abs(newVel.z);
    }
    if (newPos.z > b.max.z) {
      newVel.z = -Math.abs(newVel.z);
    }
    position[1](newPos);
    velocity[1](newVel);
  };
  return {
    render,
    update,
  };
}
