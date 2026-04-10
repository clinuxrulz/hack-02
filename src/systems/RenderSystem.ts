import { createMemo, onCleanup, createRoot, mapArray } from "solid-js";
import * as THREE from "three";
import type { ReactiveECS } from "../ReactiveECS";
import type { EntityID } from "@oasys/oecs";
import {
  RegisteredPosition,
  RegisteredPlayerConfig,
  RegisteredCourtDimensions,
  RegisteredBallConfig,
} from "../World";

export function createRenderSystem(ecs: ReactiveECS, scene: THREE.Scene): { update: () => void; dispose: () => void } {
  return createRoot((dispose) => {

    // --- Player Rendering ---
    createMemo(mapArray(
      createMemo(() => {
        let result: EntityID[] = [];
        for (let arch of ecs.query(RegisteredPosition, RegisteredPlayerConfig)) {
          let entityIds = arch.entity_ids;
          for (let i = 0; i < arch.entity_count; ++i) {
            result.push(entityIds[i] as EntityID);
          }
        }
        return result;
      }),
      (playerEntityId) => {
        let playerEntity = ecs.entity(playerEntityId());
        let playerConfig = { playerType: playerEntity.getField(RegisteredPlayerConfig, "playerType"), facingForward: playerEntity.getField(RegisteredPlayerConfig, "facingForward") };
        
        let group = new THREE.Group();
        let chinMesh: THREE.Mesh;
        let headMesh: THREE.Mesh;
        let outsideTeethMesh: THREE.Mesh[] = [];
        let middleToothMesh: THREE.Mesh;
        let eyesMesh: THREE.Mesh[] = [];

        const normalMaterial = new THREE.MeshNormalMaterial();
        const standardMaterial = new THREE.MeshStandardMaterial();

        const chinGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
        chinMesh = new THREE.Mesh(chinGeometry, normalMaterial);
        chinMesh.position.set(0.0, 0.1, 0.0);

        const headGeometry = new THREE.BoxGeometry(0.5, 0.25, 0.5);
        headMesh = new THREE.Mesh(headGeometry, normalMaterial);
        headMesh.position.set(0.0, 0.45, 0.0);

        const toothGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.1);
        const leftTooth = new THREE.Mesh(toothGeometry, standardMaterial);
        const rightTooth = new THREE.Mesh(toothGeometry, standardMaterial);
        leftTooth.position.set(-0.14, 0.3, 0.3);
        rightTooth.position.set(0.14, 0.3, 0.3);
        outsideTeethMesh = [leftTooth, rightTooth];

        const middleToothGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1);
        middleToothMesh = new THREE.Mesh(middleToothGeometry, standardMaterial);
        middleToothMesh.position.set(0.0, 0.3, 0.3);

        const eyeGeometry = new THREE.SphereGeometry(0.08);
        const leftEyeMesh = new THREE.Mesh(eyeGeometry, standardMaterial);
        const rightEyeMesh = new THREE.Mesh(eyeGeometry, standardMaterial);
        leftEyeMesh.position.set(-0.15, 0.48, 0.25);
        rightEyeMesh.position.set(0.15, 0.48, 0.25);
        eyesMesh = [leftEyeMesh, rightEyeMesh];

        group.add(chinMesh);
        group.add(headMesh);
        outsideTeethMesh.forEach((m) => group.add(m));
        group.add(middleToothMesh);
        eyesMesh.forEach((m) => group.add(m));

        scene.add(group);
        onCleanup(() => {
          scene.remove(group);
          chinGeometry.dispose();
          headGeometry.dispose();
          toothGeometry.dispose();
          middleToothGeometry.dispose();
          eyeGeometry.dispose();
          normalMaterial.dispose();
          standardMaterial.dispose();
        });

        createMemo(() => {
          let positionX = playerEntity.getField(RegisteredPosition, "x");
          let positionY = playerEntity.getField(RegisteredPosition, "y");
          let positionZ = playerEntity.getField(RegisteredPosition, "z");
          let facingForward = playerEntity.getField(RegisteredPlayerConfig, "facingForward");
          group.position.set(positionX, positionY, positionZ);
          if (facingForward === 1) { 
            group.quaternion.set(0.0, 1.0, 0.0, 0.0);
          } else {
            group.quaternion.set(0.0, 0.0, 0.0, 1.0);
          }
        });
      },
    ));

    // --- Court Rendering ---
    createMemo(mapArray(
      createMemo(() => {
        let result: EntityID[] = [];
        for (let arch of ecs.query(RegisteredCourtDimensions)) {
          let entityIds = arch.entity_ids;
          for (let i = 0; i < arch.entity_count; ++i) {
            result.push(entityIds[i] as EntityID);
          }
        }
        return result;
      }),
      (courtEntityId) => {
        let courtEntity = ecs.entity(courtEntityId());
        let dimensions = { width: courtEntity.getField(RegisteredCourtDimensions, "width"), length: courtEntity.getField(RegisteredCourtDimensions, "length"), netHeight: courtEntity.getField(RegisteredCourtDimensions, "netHeight") };
        
        const courtGroup = new THREE.Group();
        const normalMaterial = new THREE.MeshNormalMaterial();
        const transparentMaterial = new THREE.MeshNormalMaterial({
          transparent: true,
          opacity: 0.5,
        });

        const floorGeometry = new THREE.BoxGeometry(dimensions.width, 0.1, dimensions.length);
        const floorMesh = new THREE.Mesh(floorGeometry, normalMaterial);
        floorMesh.position.y -= 0.05;
        courtGroup.add(floorMesh);

        const netGeometry = new THREE.BoxGeometry(dimensions.width, dimensions.netHeight, 0.1);
        const netMesh = new THREE.Mesh(netGeometry, transparentMaterial);
        netMesh.position.y = 0.5 * dimensions.netHeight;
        courtGroup.add(netMesh);

        scene.add(courtGroup);
        onCleanup(() => {
          scene.remove(courtGroup);
          floorGeometry.dispose();
          netGeometry.dispose();
          normalMaterial.dispose();
          transparentMaterial.dispose();
        });
      },
    ));

    // --- Ball Rendering ---
    createMemo(mapArray(
      createMemo(() => {
        let result: EntityID[] = [];
        for (let arch of ecs.query(RegisteredPosition, RegisteredBallConfig)) {
          let entityIds = arch.entity_ids;
          for (let i = 0; i < arch.entity_count; ++i) {
            result.push(entityIds[i] as EntityID);
          }
        }
        return result;
      }),
      (ballEntityId) => {
        let ballEntity = ecs.entity(ballEntityId());
        let ballSize = ballEntity.getField(RegisteredBallConfig, "size");
        const ballGeometry = new THREE.SphereGeometry(ballSize);
        const ballMaterial = new THREE.MeshNormalMaterial();
        const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
        scene.add(ballMesh);
        onCleanup(() => {
          scene.remove(ballMesh);
          ballGeometry.dispose();
          ballMaterial.dispose();
        });
        createMemo(() => {
          let positionX = ballEntity.getField(RegisteredPosition, "x");
          let positionY = ballEntity.getField(RegisteredPosition, "y");
          let positionZ = ballEntity.getField(RegisteredPosition, "z");
          ballMesh.position.set(positionX, positionY, positionZ);
        });
      },
    ));

    return { update: () => {}, dispose };
  });
}