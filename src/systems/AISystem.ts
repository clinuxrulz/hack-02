import { createRoot, type Accessor } from "solid-js";
import type { ReactiveECS } from "../ReactiveECS";
import type { EntityID } from "@oasys/oecs";
import {
  RegisteredPosition,
  RegisteredVelocity,
  RegisteredDesiredMovement,
  RegisteredPlayerConfig,
  RegisteredBallConfig,
  RegisteredAI,
  RegisteredServingState,
  RegisteredGlobalGravity,
} from "../World";

const SERVE_PHASE_WAITING = 0;
const SERVE_PHASE_BALL_THROWN = 1;
const SERVE_PHASE_BALL_HIT = 2;

const COURT_LENGTH_HALF = 11.885;

function predictBallLanding(ballPos: { x: number; y: number; z: number }, ballVel: { x: number; y: number; z: number }, gravityY: number): { x: number; z: number; time: number } | null {
  if (ballVel.z >= 0) return null; // Not coming towards AI
  
  const targetY = 0.05; // Ball radius
  const v0y = ballVel.y;
  const y0 = ballPos.y;
  const g = gravityY;

  // Quadratic formula: 0.5*g*t^2 + v0y*t + (y0 - targetY) = 0
  const a = 0.5 * g;
  const b = v0y;
  const c = y0 - targetY;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;

  // We want the later time (when it hits the ground falling)
  // Since a is negative, the later time comes from the smaller numerator
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);

  if (t < 0) return null;

  return {
    x: ballPos.x + ballVel.x * t,
    z: ballPos.z + ballVel.z * t,
    time: t
  };
}

export function createAISystem(
  ecs: ReactiveECS,
): { update: (dt: number) => void; dispose: () => void } {
  return createRoot((dispose) => {
    let aiServeCooldown = 0;

    const update = (deltaTime: number) => {
      const gravity = ecs.resource(RegisteredGlobalGravity);
      const gravityY = gravity.get("y");

      if (aiServeCooldown > 0) {
        aiServeCooldown -= deltaTime;
      }

      const playerQuery = ecs.query(
        RegisteredPosition,
        RegisteredVelocity,
        RegisteredDesiredMovement,
        RegisteredPlayerConfig,
        RegisteredAI,
      );

      const ballQuery = ecs.query(RegisteredPosition, RegisteredVelocity, RegisteredBallConfig);
      const servingQuery = ecs.query(RegisteredServingState);

      let ballPos = { x: 0, y: 0, z: 0 };
      let ballVel = { x: 0, y: 0, z: 0 };

      for (const arch of ballQuery) {
        const positionsX = arch.get_column(RegisteredPosition, "x");
        const positionsY = arch.get_column(RegisteredPosition, "y");
        const positionsZ = arch.get_column(RegisteredPosition, "z");
        const velocitiesX = arch.get_column(RegisteredVelocity, "x");
        const velocitiesY = arch.get_column(RegisteredVelocity, "y");
        const velocitiesZ = arch.get_column(RegisteredVelocity, "z");

        if (arch.entity_count > 0) {
          ballPos = { x: positionsX[0], y: positionsY[0], z: positionsZ[0] };
          ballVel = { x: velocitiesX[0], y: velocitiesY[0], z: velocitiesZ[0] };
        }
      }

      let currentPhase = SERVE_PHASE_WAITING;
      let serverPlayer = 0;
      let servingEntityId: EntityID | null = null;

      if (servingQuery.archetypes.length > 0) {
        const servingArch = servingQuery.archetypes[0];
        const phases = servingArch.get_column(RegisteredServingState, "phase");
        const serverPlayers = servingArch.get_column(RegisteredServingState, "serverPlayer");
        currentPhase = phases[0];
        serverPlayer = serverPlayers[0];
        servingEntityId = servingArch.entity_ids[0] as EntityID;
      }

      const aiPlayerType = 0;
      const isAIServing = serverPlayer === aiPlayerType;

      if (isAIServing && aiServeCooldown <= 0 && currentPhase !== SERVE_PHASE_BALL_HIT) {
        if (currentPhase === SERVE_PHASE_WAITING) {
          for (const arch of playerQuery) {
            const positionsX = arch.get_column(RegisteredPosition, "x");
            const playerTypes = arch.get_column(RegisteredPlayerConfig, "playerType");

            for (let i = 0; i < arch.entity_count; i++) {
              if (playerTypes[i] === aiPlayerType) {
                const id = arch.entity_ids[i] as EntityID;
                ecs.set_field(id, RegisteredDesiredMovement, "x", 0);
                ecs.set_field(id, RegisteredDesiredMovement, "z", 0);
                break;
              }
            }
          }

          if (servingEntityId) {
            ecs.set_field(servingEntityId, RegisteredServingState, "phase", SERVE_PHASE_BALL_THROWN);
            ecs.set_field(servingEntityId, RegisteredServingState, "throwTime", 0.0);

            let playerPos = { x: 0, y: 0, z: 0 };
            for (const arch of playerQuery) {
              const positionsX = arch.get_column(RegisteredPosition, "x");
              const positionsY = arch.get_column(RegisteredPosition, "y");
              const positionsZ = arch.get_column(RegisteredPosition, "z");
              const playerTypes = arch.get_column(RegisteredPlayerConfig, "playerType");
              for (let i = 0; i < arch.entity_count; i++) {
                if (playerTypes[i] === aiPlayerType) {
                  playerPos = { x: positionsX[i], y: positionsY[i], z: positionsZ[i] };
                  break;
                }
              }
            }

            for (const arch of ballQuery) {
              const ballId = arch.entity_ids[0] as EntityID;
              ecs.set_field(ballId, RegisteredPosition, "x", playerPos.x);
              ecs.set_field(ballId, RegisteredPosition, "y", playerPos.y + 1.5);
              ecs.set_field(ballId, RegisteredPosition, "z", playerPos.z);
              ecs.set_field(ballId, RegisteredVelocity, "x", 0);
              ecs.set_field(ballId, RegisteredVelocity, "y", 4.0);
              ecs.set_field(ballId, RegisteredVelocity, "z", 0);
            }
          }
        } else if (currentPhase === SERVE_PHASE_BALL_THROWN) {
          let playerPos = { x: 0, y: 0, z: 0 };
          for (const arch of playerQuery) {
            const positionsX = arch.get_column(RegisteredPosition, "x");
            const positionsY = arch.get_column(RegisteredPosition, "y");
            const positionsZ = arch.get_column(RegisteredPosition, "z");
            const playerTypes = arch.get_column(RegisteredPlayerConfig, "playerType");
            for (let i = 0; i < arch.entity_count; i++) {
              if (playerTypes[i] === aiPlayerType) {
                playerPos = { x: positionsX[i], y: positionsY[i], z: positionsZ[i] };
                break;
              }
            }
          }

          const dx = ballPos.x - playerPos.x;
          const dz = ballPos.z - playerPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          // AI hits the serve when it starts falling and is at a good height
          if (dist < 0.5 && ballVel.y < 1.0 && ballPos.y > 1.5) {
            if (servingEntityId) {
              ecs.set_field(servingEntityId, RegisteredServingState, "phase", SERVE_PHASE_BALL_HIT);

              for (const arch of ballQuery) {
                const ballId = arch.entity_ids[0] as EntityID;
                const hitVelX = (Math.random() - 0.5) * 1.5;
                const hitVelY = 3 + Math.random() * 1.5;
                const hitVelZ = 8;

                ecs.set_field(ballId, RegisteredVelocity, "x", hitVelX);
                ecs.set_field(ballId, RegisteredVelocity, "y", hitVelY);
                ecs.set_field(ballId, RegisteredVelocity, "z", hitVelZ);
              }

              aiServeCooldown = 2.0;
            }
          }
        }
      }

      if (!isAIServing || currentPhase === SERVE_PHASE_BALL_HIT || currentPhase === SERVE_PHASE_WAITING) {
        for (const arch of playerQuery) {
          const positionsX = arch.get_column(RegisteredPosition, "x");
          const positionsZ = arch.get_column(RegisteredPosition, "z");
          const playerConfigTypes = arch.get_column(RegisteredPlayerConfig, "playerType");
          const entityIds = arch.entity_ids;

          for (let i = 0; i < arch.entity_count; i++) {
            const playerType = playerConfigTypes[i];
            if (playerType !== aiPlayerType) continue;

            const playerX = positionsX[i];
            const playerZ = positionsZ[i];

            let moveX = 0;
            let moveZ = 0;

            const ballComingTowardsAI = ballVel.z < 0 && ballPos.z > playerZ - 5;
            const ballGoingAway = ballVel.z > 0;
            const canReachBall = ballPos.y < 2.3;
            
            if (ballComingTowardsAI && !canReachBall) {
              const landing = predictBallLanding(ballPos, ballVel, gravityY);
              if (landing) {
                // Stay behind the landing spot (more negative Z for AI)
                const idealZ = Math.max(-COURT_LENGTH_HALF + 1, Math.min(-0.5, landing.z - 1.5));
                const zDiff = idealZ - playerZ;
                if (Math.abs(zDiff) > 0.1) {
                  moveZ = zDiff > 0 ? 1 : -1;
                }
              } else {
                // If ball is coming fast but no landing predicted yet, move back just in case
                moveZ = -1;
              }
            } else if (ballComingTowardsAI && canReachBall) {
              // Volley/Near ball logic: Stay behind the ball
              const idealZ = ballPos.z - 1.2;
              const zDiff = idealZ - playerZ;
              if (Math.abs(zDiff) > 0.1) {
                moveZ = zDiff > 0 ? 1 : -1;
              }
            } else if (ballGoingAway) {
              const idealDefenseZ = -6.0;
              const zDiff = idealDefenseZ - playerZ;
              if (Math.abs(zDiff) > 0.2) {
                moveZ = zDiff > 0 ? 1 : -1;
              }
            } else {
              const idealDefenseZ = -5.0;
              const zDiff = idealDefenseZ - playerZ;
              if (Math.abs(zDiff) > 0.2) {
                moveZ = zDiff > 0 ? 1 : -1;
              }
            }

            // Lateral movement
            if (ballComingTowardsAI || (ballPos.z < 0)) {
              const xDiff = ballPos.x - playerX;
              if (Math.abs(xDiff) > 0.2) {
                moveX = xDiff > 0 ? 1 : -1;
              }
            }

            const id = entityIds[i] as EntityID;
            ecs.set_field(id, RegisteredDesiredMovement, "x", moveX);
            ecs.set_field(id, RegisteredDesiredMovement, "z", moveZ);
          }
        }
      }
    };

    return { update, dispose };
  });
}