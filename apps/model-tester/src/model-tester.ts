import { createSignal, createMemo, Accessor } from "solid-js";
import * as THREE from "three";

let [ meltyLib, setMeltyLib, ] = createSignal<typeof import("../../melty-tennis/src/models/melty")>();
let [ cubeyLib, setCubeyLib, ] = createSignal<typeof import("../../melty-tennis/src/models/cubey")>();

import("../../melty-tennis/src/models/melty").then(setMeltyLib);
import("../../melty-tennis/src/models/cubey").then(setCubeyLib);

export function createMeltyModelHMR(): Accessor<THREE.Object3D | undefined> {
  return createMemo(() => {
    let meltyLib2 = meltyLib();
    if (meltyLib2 == undefined) {
      return undefined;
    }
    return meltyLib2.createMelty();
  });
}

export function createCubeyModelHMR(): Accessor<THREE.Object3D | undefined> {
  return createMemo(() => {
    let cubeyLib2 = cubeyLib();
    if (cubeyLib2 == undefined) {
      return undefined;
    }
    return cubeyLib2.createCubey();
  });
}


if (import.meta.hot) {
  import.meta.hot.accept("../../melty-tennis/src/models/melty", (lib) => {
    setMeltyLib(lib as any);
  });
  import.meta.hot.accept("../../melty-tennis/src/models/cubey", (lib) => {
    setCubeyLib(lib as any);
  });
}