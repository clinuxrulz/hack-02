import type { Accessor } from "solid-js";
import type { ReactiveECS } from "@melty-tennis/reactive-ecs";
import type { EntityID } from "@oasys/oecs";
import { RegisteredDesiredMovement, RegisteredInputControlled } from "../World";
import * as THREE from "three";

export function createInputProcessingSystem(
  ecs: ReactiveECS,
  upDown: Accessor<boolean>,
  downDown: Accessor<boolean>,
  leftDown: Accessor<boolean>,
  rightDown: Accessor<boolean>,
  joystickValue: Accessor<THREE.Vector2>,
): { update: () => void; dispose: () => void } {
  const update = () => {
    const playerMovements: { entityId: number; moveX: number; moveZ: number; }[] = [];
    const playerQuery = ecs.query(RegisteredInputControlled, RegisteredDesiredMovement);

    for (const arch of playerQuery) {
      const desiredMovementX = arch.get_column(RegisteredDesiredMovement, "x");
      const desiredMovementZ = arch.get_column(RegisteredDesiredMovement, "z");
      const entityIds = arch.entity_ids;

      for (let i = 0; i < arch.entity_count; i++) {
        const entityId = entityIds[i];
        let moveX = 0;
        let moveZ = 0;

        if (leftDown()) {
          moveX -= 1;
        }
        if (rightDown()) {
          moveX += 1;
        }
        if (downDown()) {
          moveZ += 1;
        }
        if (upDown()) {
          moveZ -= 1;
        }

        moveX += joystickValue().x;
        moveZ += joystickValue().y;
        playerMovements.push({ entityId, moveX, moveZ });
      }
    }
    for (const { entityId, moveX, moveZ } of playerMovements) {
      const id = entityId as EntityID;
      ecs.set_field(id, RegisteredDesiredMovement, "x", moveX);
      ecs.set_field(id, RegisteredDesiredMovement, "z", moveZ);
    }
  };

  return { update, dispose: () => {} };
}