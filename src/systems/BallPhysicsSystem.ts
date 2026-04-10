import { createRoot } from "solid-js";
import type { ReactiveECS } from "../ReactiveECS";
import type { EntityID } from "@oasys/oecs";
import {
  RegisteredPosition,
  RegisteredVelocity,
  RegisteredBallConfig,
  RegisteredBoundary,
  RegisteredGravityAffected,
  RegisteredGlobalGravity,
} from "../World";

export function createBallPhysicsSystem(
  ecs: ReactiveECS,
): { update: (dt: number) => void; dispose: () => void } {
  return createRoot((dispose) => {
    const update = (deltaTime: number) => {
      if (deltaTime === 0) return;

      const gravity = ecs.resource(RegisteredGlobalGravity);

      const ballUpdates: {
        entityId: number;
        newPosX: number;
        newPosY: number;
        newPosZ: number;
        newVelX: number;
        newVelY: number;
        newVelZ: number;
      }[] = [];

      for (const arch of ecs.query(RegisteredPosition, RegisteredVelocity, RegisteredBallConfig, RegisteredBoundary, RegisteredGravityAffected)) {
        const positionsX = arch.get_column(RegisteredPosition, "x");
        const positionsY = arch.get_column(RegisteredPosition, "y");
        const positionsZ = arch.get_column(RegisteredPosition, "z");
        const velocitiesX = arch.get_column(RegisteredVelocity, "x");
        const velocitiesY = arch.get_column(RegisteredVelocity, "y");
        const velocitiesZ = arch.get_column(RegisteredVelocity, "z");
        const sizes = arch.get_column(RegisteredBallConfig, "size");
        const minXs = arch.get_column(RegisteredBoundary, "minX");
        const minYs = arch.get_column(RegisteredBoundary, "minY");
        const minZs = arch.get_column(RegisteredBoundary, "minZ");
        const maxXs = arch.get_column(RegisteredBoundary, "maxX");
        const maxYs = arch.get_column(RegisteredBoundary, "maxY");
        const maxZs = arch.get_column(RegisteredBoundary, "maxZ");
        const entityIds = arch.entity_ids;

        for (let i = 0; i < arch.entity_count; i++) {
          const entityId = entityIds[i];
          const position = { x: positionsX[i], y: positionsY[i], z: positionsZ[i] };
          const velocity = { x: velocitiesX[i], y: velocitiesY[i], z: velocitiesZ[i] };
          const ballConfig = { size: sizes[i] };
          const boundary = { minX: minXs[i], minY: minYs[i], minZ: minZs[i], maxX: maxXs[i], maxY: maxYs[i], maxZ: maxZs[i] };

          let newVelX = velocity.x;
          let newVelY = velocity.y;
          let newVelZ = velocity.z;

          newVelX += gravity.get("x") * deltaTime;
          newVelY += gravity.get("y") * deltaTime;
          newVelZ += gravity.get("z") * deltaTime;

          let newPosX = position.x + newVelX * deltaTime;
          let newPosY = position.y + newVelY * deltaTime;
          let newPosZ = position.z + newVelZ * deltaTime;

          const ballRadius = ballConfig.size * 0.5;

          const minBoundaryX = boundary.minX + ballRadius;
          const maxBoundaryX = boundary.maxX - ballRadius;
          const minBoundaryY = boundary.minY + ballRadius;
          const maxBoundaryY = boundary.maxY - ballRadius;
          const minBoundaryZ = boundary.minZ + ballRadius;
          const maxBoundaryZ = boundary.maxZ - ballRadius;

          if (newPosX < minBoundaryX) {
            newPosX = minBoundaryX;
            newVelX = -newVelX * 0.8;
          } else if (newPosX > maxBoundaryX) {
            newPosX = maxBoundaryX;
            newVelX = -newVelX * 0.8;
          }

          if (newPosY < minBoundaryY) {
            newPosY = minBoundaryY;
            newVelY = -newVelY * 0.8;
            if (Math.abs(newVelY) < 0.1) newVelY = 0;
          } else if (newPosY > maxBoundaryY) {
            newPosY = maxBoundaryY;
            newVelY = -newVelY * 0.8;
          }

          if (newPosZ < minBoundaryZ) {
            newPosZ = minBoundaryZ;
            newVelZ = -newVelZ * 0.8;
          } else if (newPosZ > maxBoundaryZ) {
            newPosZ = maxBoundaryZ;
            newVelZ = -newVelZ * 0.8;
          }
          ballUpdates.push({ entityId, newPosX, newPosY, newPosZ, newVelX, newVelY, newVelZ });
        }
      }
      for (const { entityId, newPosX, newPosY, newPosZ, newVelX, newVelY, newVelZ } of ballUpdates) {
        const id = entityId as EntityID;
        ecs.set_field(id, RegisteredPosition, "x", newPosX);
        ecs.set_field(id, RegisteredPosition, "y", newPosY);
        ecs.set_field(id, RegisteredPosition, "z", newPosZ);
        ecs.set_field(id, RegisteredVelocity, "x", newVelX);
        ecs.set_field(id, RegisteredVelocity, "y", newVelY);
        ecs.set_field(id, RegisteredVelocity, "z", newVelZ);
      }
    };

    return { update, dispose };
  });
}