import { type Accessor, createEffect, createSignal,  onCleanup, type Signal } from "solid-js";
import * as THREE from "three";
import type { ReactiveECS } from "@melty-tennis/reactive-ecs";
import type { EntityID } from "@oasys/oecs";
import { RegisteredPosition, RegisteredVelocity, RegisteredPlayerConfig } from "./World";
import { PlayerTypeEnum } from "./components";

export function Player(params: {
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  playerType: "Cubey" | "Melty",
  facingForward: boolean,
  reactiveEcs: ReactiveECS,
}): EntityID {
  const ecs = params.reactiveEcs;
  
  const entityId = ecs.create_entity();
  ecs.add_component(entityId, RegisteredPosition, { x: params.position.x, y: params.position.y, z: params.position.z });
  ecs.add_component(entityId, RegisteredVelocity, { x: params.velocity.x, y: params.velocity.y, z: params.velocity.z });
  const playerTypeNum: PlayerTypeEnum = params.playerType === "Cubey" ? 0 : 1;
  const facingForwardNum: 0 | 1 = params.facingForward ? 1 : 0;
  ecs.add_component(entityId, RegisteredPlayerConfig, { playerType: playerTypeNum, facingForward: facingForwardNum });
  // Renderable component will be added by the RenderSystem
  
  return entityId;
}
