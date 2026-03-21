import { type Accessor } from "solid-js";
import * as THREE from "three";

namespace Ball {
  export type Params = {
    position: THREE.Vector3,
  };
}

export function Ball(params: {
  position: Accessor<THREE.Vector3>
}): {
} {
  return {};
}
