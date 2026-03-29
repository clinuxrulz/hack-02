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
  let chinMesh: THREE.Mesh;
  {
    let geometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
    let material = new THREE.MeshNormalMaterial();
    onCleanup(() => {
      geometry.dispose();
      material.dispose();
    });
    chinMesh = new THREE.Mesh(geometry, material);
    chinMesh.position.set(0.0, 0.1, 0.0);
  }
  let headMesh: THREE.Mesh;
  {
    let geometry = new THREE.BoxGeometry(0.5, 0.25, 0.5);
    let material = new THREE.MeshNormalMaterial();
    onCleanup(() => {
      geometry.dispose();
      material.dispose();
    });
    headMesh = new THREE.Mesh(geometry, material);
    headMesh.position.set(0.0, 0.45, 0.0);
  }
  let outsideTeethMesh: THREE.Mesh[];
  {
    let geometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    let material = new THREE.MeshNormalMaterial();
    onCleanup(() => {
      geometry.dispose();
      material.dispose();
    });
    let leftTooth = new THREE.Mesh(geometry, material);
    leftTooth.position.set(-0.1, 0.1, 0.0); 
    outsideTeethMesh = [ leftTooth, ];
  }
  let group = new THREE.Group();
  createEffect(params.position, (p) => {
    group.position.copy(p);
  });
  group.add(chinMesh);
  group.add(headMesh);
  outsideTeethMesh.forEach((m) => group.add(m));
  params.target.add(group);
  onCleanup(() => {
    params.target.remove(group);
  });
}
