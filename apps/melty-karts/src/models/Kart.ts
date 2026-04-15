import * as THREE from "three";
import { OBJLoader } from "three-stdlib";
import { TRACK_WIDTH } from "./Track";

export async function loadKartModel(): Promise<THREE.Group> {
  const loader = new OBJLoader();
  
  try {
    const response = await fetch("./models/car-kart-red.obj");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    
    const kart = loader.parse(text);
    
    kart.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material instanceof THREE.Material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.name?.includes("red")) {
            mat.color.setHex(0xcc2233);
            mat.roughness = 0.4;
            mat.metalness = 0.3;
          } else if (mat.name?.includes("black")) {
            mat.color.setHex(0x111111);
            mat.roughness = 0.8;
          } else if (mat.name?.includes("metal")) {
            mat.color.setHex(0x888888);
            mat.roughness = 0.3;
            mat.metalness = 0.8;
          } else if (mat.name?.includes("tires")) {
            mat.color.setHex(0x222222);
            mat.roughness = 0.9;
          } else if (mat.name?.includes("windows")) {
            mat.color.setHex(0x334466);
            mat.roughness = 0.1;
            mat.metalness = 0.2;
            (mat as any).transparent = true;
            (mat as any).opacity = 0.7;
          }
        }
      }
    });
    
    const box = new THREE.Box3().setFromObject(kart);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 1.5;
    const scale = targetSize / maxDim;
    kart.scale.setScalar(scale);
    
    box.setFromObject(kart);
    const center = box.getCenter(new THREE.Vector3());
    kart.position.x -= center.x;
    kart.position.y -= center.y;
    kart.position.z -= center.z;
    
    return kart;
  } catch (e) {
    console.error("Failed to load kart:", e);
    throw e;
  }
}

export async function placeKartAtStart(
  curve: THREE.CatmullRomCurve3,
  scene: THREE.Scene
): Promise<THREE.Group> {
  const kart = await loadKartModel();
  
  const t = 0.01;
  const pos = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t);
  const tangent2D = new THREE.Vector2(tangent.x, tangent.z).normalize();
  const normal2D = new THREE.Vector2(-tangent2D.y, tangent2D.x);
  
  const offset = TRACK_WIDTH / 4;
  kart.position.set(
    pos.x + normal2D.x * offset,
    pos.y + 0.05,
    pos.z + normal2D.y * offset
  );
  
  const angle = Math.atan2(tangent.x, tangent.z);
  kart.rotation.y = angle + Math.PI;
  
  scene.add(kart);
  return kart;
}