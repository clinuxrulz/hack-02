import { createMemo, createSignal, type Signal, onCleanup } from "solid-js";
import * as THREE from "three";
import type { ReactiveECS } from "./ReactiveECS";
import type { EntityID } from "@oasys/oecs";
import { RegisteredCourtDimensions } from "./World";

export function Court(params: {
  width: number,
  length: number,
  netHeight: number,
  reactiveEcs: ReactiveECS,
}): EntityID {
  const ecs = params.reactiveEcs;

  const entityId = ecs.create_entity();
  ecs.add_component(entityId, RegisteredCourtDimensions, { width: params.width, length: params.length, netHeight: params.netHeight });
  // Renderable component will be added by the RenderSystem

  return entityId;
}
