import { createEffect, createMemo, createSignal, type Signal, onCleanup } from "solid-js";
import * as THREE from "three";

namespace Court {
  export type Params = {
    width: number,
    length: number,
    netHeight: number,
  };
}

export class Court {
  width: Signal<number>;
  length: Signal<number>;
  netHeight: Signal<number>;

  constructor(params: Court.Params) {
    this.width = createSignal(params.width);
    this.length = createSignal(params.length);
    this.netHeight = createSignal(params.netHeight);
  }

  render(target: THREE.Object3D): void {
    createMemo(
      () => {
        let width = this.width[0]();
        let length = this.length[0]();
        let geometry = new THREE.BoxGeometry(
          width,
          0.1,
          length,
        );
        let material = new THREE.MeshNormalMaterial();
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.y -= 0.05;
        target.add(mesh);
        onCleanup(() => {
          target.remove(mesh);
          geometry.dispose();
          material.dispose();
        });
      },
    );
    createMemo(() => {
      let width = this.width[0]();
      let netHeight = this.netHeight[0]();
      let geometry = new THREE.BoxGeometry(
        width,
        netHeight,
        0.1,
      );
      let material = new THREE.MeshNormalMaterial({
        transparent: true,
        opacity: 0.5
      });
      let mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 0.5 * netHeight;
      target.add(mesh);
      onCleanup(() => {
        target.remove(mesh);
      });
    });
  }
}
