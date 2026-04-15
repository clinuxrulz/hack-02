import { createRoot, type Accessor } from "solid-js";
import type { ReactiveECS } from "@melty-tennis/reactive-ecs";
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
import {
  getSharedNetwork,
  addTrainingSample,
  extractInputs,
} from "../NNManager";

const SERVE_PHASE_WAITING = 0;
const SERVE_PHASE_BALL_THROWN = 1;
const SERVE_PHASE_BALL_HIT = 2;

function predictBallLanding(ballPos: { x: number; y: number; z: number }, ballVel: { x: number; y: number; z: number }, gravityY: number): { x: number; z: number; time: number } | null {
  if (ballVel.z >= 0) return null;
  
  const targetY = 0.05;
  const v0y = ballVel.y;
  const y0 = ballPos.y;
  const g = gravityY;

  const a = 0.5 * g;
  const b = v0y;
  const c = y0 - targetY;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;

  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  if (t < 0) return null;

  return {
    x: ballPos.x + ballVel.x * t,
    z: ballPos.z + ballVel.z * t,
    time: t
  };
}

let useNNSignal: () => boolean = () => false;
let aiVsAiSignal: () => boolean = () => false;

export function setUseNN(signal: () => boolean, aiVsAi: () => boolean) {
  useNNSignal = signal;
  aiVsAiSignal = aiVsAi;
}

function computeRuleBasedMovement(
  playerX: number,
  playerY: number,
  playerZ: number,
  ballPos: { x: number; y: number; z: number },
  ballVel: { x: number; y: number; z: number },
  playerType: number,
  gravityY: number
): { moveX: number; moveZ: number; jump: number } {
  let moveX = 0;
  let moveZ = 0;
  let jump = 0;

  const ballGoingAway = playerType === 0 ? ballVel.z > 0 : ballVel.z < 0;
  const ballOnMySide = playerType === 0 ? ballPos.z < 0 : ballPos.z > 0;
  const ballComingTowardsAI = ballOnMySide && 
    (playerType === 0 ? ballVel.z < 0 : ballVel.z > 0);
  const canReachBall = ballPos.y < 3.0;
         
  if (ballComingTowardsAI) {
    if (!canReachBall) {
      const landing = predictBallLanding(ballPos, ballVel, gravityY);
      if (landing) {
        const targetZ = playerType === 0 
          ? Math.max(-5, Math.min(-0.5, landing.z - 0.5))
          : Math.min(5, Math.max(0.5, landing.z + 0.5));
        const zDiff = targetZ - playerZ;
        if (Math.abs(zDiff) > 0.3) {
          moveZ = zDiff > 0 ? 1 : -1;
        }
      } else {
        moveZ = playerType === 0 ? -1 : 1;
      }
    } else {
      const targetZ = ballPos.z + (playerType === 0 ? -0.5 : 0.5);
      const zDiff = targetZ - playerZ;
      if (Math.abs(zDiff) > 0.2) {
        moveZ = zDiff > 0 ? 1 : -1;
      }
    }
  } else if (ballGoingAway) {
    // Stay closer to baseline, don't chase too far
    const idealDefenseZ = playerType === 0 ? -4 : 4;
    const zDiff = idealDefenseZ - playerZ;
    if (Math.abs(zDiff) > 0.3) {
      moveZ = zDiff > 0 ? 1 : -1;
    }
  } else {
    // Stay at ready position
    const idealZ = playerType === 0 ? -3 : 3;
    const zDiff = idealZ - playerZ;
    if (Math.abs(zDiff) > 0.3) {
      moveZ = zDiff > 0 ? 1 : -1;
    }
  }

  if (ballComingTowardsAI || (playerType === 0 ? ballPos.z > 0 : ballPos.z < 0)) {
    const xDiff = ballPos.x - playerX;
    if (Math.abs(xDiff) > 0.2) {
      moveX = xDiff > 0 ? 1 : -1;
    }
  }

  const ballAboveHead = ballPos.y > playerY + 0.5 && ballPos.y < playerY + 2.5;
  const ballNear = Math.abs(ballPos.z - playerZ) < 1.5 && Math.abs(ballPos.x - playerX) < 1.0;
  if (ballAboveHead && ballNear) {
    jump = 1;
  }

  return { moveX, moveZ, jump };
}

export function createAISystem(
  ecs: ReactiveECS,
): { update: (dt: number) => void; dispose: () => void } {
  return createRoot((dispose) => {
    let aiServeCooldown = 0;
    let isTrainMode = false;

    const update = (deltaTime: number) => {
      const gravity = ecs.resource(RegisteredGlobalGravity);
      const gravityY = gravity.get("y");
      
      isTrainMode = aiVsAiSignal();

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

      const useNN = useNNSignal();
      const nn = useNN ? getSharedNetwork() : null;

      for (const arch of playerQuery) {
          const positionsX = arch.get_column(RegisteredPosition, "x");
          const positionsY = arch.get_column(RegisteredPosition, "y");
          const positionsZ = arch.get_column(RegisteredPosition, "z");
          const playerTypes = arch.get_column(RegisteredPlayerConfig, "playerType");
          const entityIds = arch.entity_ids;

          for (let i = 0; i < arch.entity_count; i++) {
            const playerType = playerTypes[i];
            const playerZ = positionsZ[i];
            const aiIsServing = playerType === serverPlayer;

            if (aiIsServing && aiServeCooldown <= 0 && currentPhase !== SERVE_PHASE_BALL_HIT) {
              if (currentPhase === SERVE_PHASE_WAITING) {
                const id = entityIds[i] as EntityID;
                ecs.set_field(id, RegisteredDesiredMovement, "x", 0);
                ecs.set_field(id, RegisteredDesiredMovement, "z", 0);

                if (servingEntityId) {
                  ecs.set_field(servingEntityId, RegisteredServingState, "phase", SERVE_PHASE_BALL_THROWN);
                  ecs.set_field(servingEntityId, RegisteredServingState, "throwTime", 0.0);

                  const playerPos = { x: positionsX[i], y: positionsY[i], z: positionsZ[i] };
                  for (const bArch of ballQuery) {
                    const ballId = bArch.entity_ids[0] as EntityID;
                    ecs.set_field(ballId, RegisteredPosition, "x", playerPos.x);
                    ecs.set_field(ballId, RegisteredPosition, "y", playerPos.y + 1.5);
                    ecs.set_field(ballId, RegisteredPosition, "z", playerPos.z);
                    ecs.set_field(ballId, RegisteredVelocity, "x", 0);
                    ecs.set_field(ballId, RegisteredVelocity, "y", 4.0);
                    ecs.set_field(ballId, RegisteredVelocity, "z", 0);
                  }
                }
              } else if (currentPhase === SERVE_PHASE_BALL_THROWN) {
                const dx = ballPos.x - positionsX[i];
                const dz = ballPos.z - positionsZ[i];
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < 0.5 && ballPos.y > 0.5 && ballPos.y < 3.0) {
                  if (servingEntityId) {
                    ecs.set_field(servingEntityId, RegisteredServingState, "phase", SERVE_PHASE_BALL_HIT);

                    for (const bArch of ballQuery) {
                      const ballId = bArch.entity_ids[0] as EntityID;
                      const hitVelX = (Math.random() - 0.5) * 1.5;
                      const hitVelY = 3 + Math.random() * 1.5;
                      const hitVelZ = playerType === 0 ? 8 : -8;

                      ecs.set_field(ballId, RegisteredVelocity, "x", hitVelX);
                      ecs.set_field(ballId, RegisteredVelocity, "y", hitVelY);
                      ecs.set_field(ballId, RegisteredVelocity, "z", hitVelZ);
                    }

                    aiServeCooldown = 2.0;
                  }
                }
              }
            }

            if (!aiIsServing || currentPhase === SERVE_PHASE_BALL_HIT || currentPhase === SERVE_PHASE_WAITING) {
              const playerX = positionsX[i];
              const playerY = positionsY[i];

              let moveX = 0;
              let moveZ = 0;
              let jump = 0;

              const inputs = extractInputs(
                playerX, playerY, playerZ,
                ballPos.x, ballPos.y, ballPos.z,
                ballVel.x, ballVel.y, ballVel.z,
                playerType, gravityY
              );

              const ruleBased = computeRuleBasedMovement(
                playerX, playerY, playerZ, ballPos, ballVel, playerType, gravityY
              );

              if (nn && useNN) {
                const outputs = nn.forward(inputs);
                moveX = outputs[0] > 0.3 ? 1 : outputs[0] < -0.3 ? -1 : 0;
                moveZ = outputs[1] > 0.3 ? 1 : outputs[1] < -0.3 ? -1 : 0;
                jump = outputs[2] > 0.3 ? 1 : 0;

                if (isTrainMode && (Math.abs(moveX - ruleBased.moveX) > 0.1 || Math.abs(moveZ - ruleBased.moveZ) > 0.1 || jump !== ruleBased.jump)) {
                  addTrainingSample(inputs, [ruleBased.moveX, ruleBased.moveZ, ruleBased.jump]);
                }
              } else {
                moveX = ruleBased.moveX;
                moveZ = ruleBased.moveZ;
                jump = ruleBased.jump;
              }

              const id = entityIds[i] as EntityID;
              ecs.set_field(id, RegisteredDesiredMovement, "x", moveX);
              ecs.set_field(id, RegisteredDesiredMovement, "z", moveZ);
              ecs.set_field(id, RegisteredDesiredMovement, "jump", jump);
            }
          }
        }
    };

    return { update, dispose };
  });
}