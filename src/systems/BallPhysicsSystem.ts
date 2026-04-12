import { createRoot, type Accessor } from "solid-js";
import type { ReactiveECS } from "../ReactiveECS";
import type { EntityID } from "@oasys/oecs";
import {
  RegisteredPosition,
  RegisteredVelocity,
  RegisteredBallConfig,
  RegisteredGravityAffected,
  RegisteredGlobalGravity,
  RegisteredPlayerConfig,
  RegisteredRacketSide,
  RegisteredServingState,
} from "../World";
import { gameEvents } from "../Events";

export function createBallPhysicsSystem(
  ecs: ReactiveECS,
  hitPower: Accessor<number>,
  hitTriggered: Accessor<boolean>,
): { update: (dt: number) => void; dispose: () => void } {
  return createRoot((dispose) => {
    let hitCooldown = 0;
    let lastHitPlayer = -1;
    let wasAboveGround = true;

    const update = (deltaTime: number) => {
      const gravity = ecs.resource(RegisteredGlobalGravity);
      
      if (hitCooldown > 0) {
        hitCooldown -= deltaTime;
      }

      const ballUpdates: {
        entityId: EntityID;
        newPosX: number;
        newPosY: number;
        newPosZ: number;
        newVelX: number;
        newVelY: number;
        newVelZ: number;
      }[] = [];

      for (const arch of ecs.query(RegisteredPosition, RegisteredVelocity, RegisteredBallConfig, RegisteredGravityAffected)) {
        const positionsX = arch.get_column(RegisteredPosition, "x");
        const positionsY = arch.get_column(RegisteredPosition, "y");
        const positionsZ = arch.get_column(RegisteredPosition, "z");
        const velocitiesX = arch.get_column(RegisteredVelocity, "x");
        const velocitiesY = arch.get_column(RegisteredVelocity, "y");
        const velocitiesZ = arch.get_column(RegisteredVelocity, "z");
        const sizes = arch.get_column(RegisteredBallConfig, "size");
        const entityIds = arch.entity_ids;

        for (let i = 0; i < arch.entity_count; i++) {
          const entityId = entityIds[i];
          const position = { x: positionsX[i], y: positionsY[i], z: positionsZ[i] };
          const velocity = { x: velocitiesX[i], y: velocitiesY[i], z: velocitiesZ[i] };
          const ballConfig = { size: sizes[i] };

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

          if (newPosY < ballRadius) {
            newPosY = ballRadius;
            newVelY = -newVelY * 0.7;
            newVelZ = newVelZ * 0.7;
            if (Math.abs(newVelY) < 0.3) newVelY = 0;
            if (wasAboveGround) {
              gameEvents.emit("ballBounce", { z: newPosZ, y: newPosY });
            }
          }
          wasAboveGround = newPosY > ballRadius;

          const servingQuery = ecs.query(RegisteredServingState);
          let isInServingMode = false;
          if (servingQuery.archetypes.length > 0) {
            const servingArch = servingQuery.archetypes[0];
            const phases = servingArch.get_column(RegisteredServingState, "phase");
            if (phases[0] !== 2) {
              isInServingMode = true;
            }
          }
          
          if (hitCooldown <= 0 && !isInServingMode) {
            for (const playerArch of ecs.query(RegisteredPosition, RegisteredVelocity, RegisteredPlayerConfig, RegisteredRacketSide)) {
              const playerPosX = playerArch.get_column(RegisteredPosition, "x")[0];
              const playerPosY = playerArch.get_column(RegisteredPosition, "y")[0];
              const playerPosZ = playerArch.get_column(RegisteredPosition, "z")[0];
              const playerVelX = playerArch.get_column(RegisteredVelocity, "x")[0];
              const playerType = playerArch.get_column(RegisteredPlayerConfig, "playerType")[0];
              const facingForward = playerArch.get_column(RegisteredPlayerConfig, "facingForward")[0];
              const racketSide = playerArch.get_column(RegisteredRacketSide, "side")[0];
              
              const racketOffsetX = racketSide * 0.5;
              const racketX = playerPosX + racketOffsetX;
              const racketY = playerPosY + 0.5;
              const racketZ = playerPosZ + (facingForward === 1 ? -0.4 : 0.4);
              
              const racketRadius = 0.8;
              const dx = newPosX - racketX;
              const dy = newPosY - racketY;
              const dz = newPosZ - racketZ;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              
// Increase hit distance to make it easier
              if (dist < racketRadius + ballRadius + 0.3) {
                const direction = playerType === 0 ? 1 : -1;
                const movementInfluence = playerVelX * 0.5;
                const power = 0.7;
                const basePower = 1.0;
                const powerScale = basePower + power * 0.5;
                const hitX = racketX + dx * 0.5;
                const hitY = racketY + 0.3;
                newVelX = (newPosX - hitX) * 0.8 + movementInfluence;
                newVelY = 4.5 * powerScale;
                newVelZ = direction * 6.0 * powerScale;
                newPosY = hitY + ballRadius;
                hitCooldown = 0.3;
                lastHitPlayer = playerType;
                gameEvents.emit("ballHit", { player: playerType });
                break;
              }
              
              const rayDx = newPosX - position.x;
              const rayDy = newPosY - position.y;
              const rayDz = newPosZ - position.z;
              const rayLen = Math.sqrt(rayDx * rayDx + rayDy * rayDy + rayDz * rayDz);
              
              if (rayLen > 0.01) {
                const t = Math.max(0, Math.min(1, 
                  ((racketX - position.x) * rayDx + (racketY - position.y) * rayDy + (racketZ - position.z) * rayDz) / (rayLen * rayLen)
                ));
                const closestX = position.x + t * rayDx;
                const closestY = position.y + t * rayDy;
                const closestZ = position.z + t * rayDz;
                
                const closestDx = closestX - racketX;
                const closestDy = closestY - racketY;
                const closestDz = closestZ - racketZ;
                const closestDist = Math.sqrt(closestDx * closestDx + closestDy * closestDy + closestDz * closestDz);
                
                if (closestDist < racketRadius + ballRadius + 0.3) {
                  const direction = playerType === 0 ? 1 : -1;
                  const hitStrength = 1.0 - (closestDist / (racketRadius + ballRadius + 0.3));
const movementInfluence = playerVelX * 0.5;
                  const power = 0.7;
                  const basePower = 1.0;
                  const powerScale = basePower + power * 0.5;
                  newVelX = (closestDx / closestDist) * 0.8 * hitStrength + movementInfluence;
newVelY = 1.5 * powerScale;
                  newVelZ = direction * 6.0 * powerScale;
                  newPosY = Math.max(newPosY, racketY + racketRadius + ballRadius + 0.2);
                  hitCooldown = 0.3;
                  lastHitPlayer = playerType;
                  gameEvents.emit("ballHit", { player: playerType });
                  break;
                }
              }
            }
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