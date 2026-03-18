import * as THREE from "three";
import { latest, createSignal, type Signal } from "solid-js";
import { mkSetProtector } from "./util";

namespace Player {
  export type Params = {
    position: THREE.Vector3,
    velocity: THREE.Vector3,
  };
}

export class Player {
  readonly position: Signal<THREE.Vector3>;
  readonly velocity: Signal<THREE.Vector3>;

  constructor(params: Player.Params) {
    this.position = createSignal(params.position);
    this.velocity = createSignal(params.velocity);
  }
}
