import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

export function createSolidLogo(): THREE.Object3D {
  let group = new THREE.Group();

  const material1 = new THREE.MeshStandardMaterial({
    color: 0x518ac8,
  });
  const material2 = new THREE.MeshStandardMaterial({
    color: 0x76b3e1,
  });

  const depth = 50;

  const svgPath = 'm 135.55266,65.650453 a 45,45 0 0 0 -48.000001,-15 l -62,20 c 0,0 53,40.000007 94.000001,29.999997 l 3,-0.999997 c 17,-5 23,-21 13,-34 z';

  const loader = new SVGLoader();
  const svgData = loader.parse(`<svg><path d="${svgPath}"/></svg>`);
  const shapes = SVGLoader.createShapes(svgData.paths[0]);
  const teardropShape = shapes[0];

  const scale = 0.006;

  const geometry1 = new THREE.ExtrudeGeometry(teardropShape, {
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    depth: depth,
  });
  geometry1.center();

  const teardrop1 = new THREE.Mesh(geometry1, material1);
  teardrop1.position.set(-0.05, 0.16, 0);
  teardrop1.scale.set(scale, scale, scale);
  group.add(teardrop1);

  const geometry2 = new THREE.ExtrudeGeometry(teardropShape, {
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    depth: depth,
  });
  geometry2.center();

  const teardrop2 = new THREE.Mesh(geometry2, material2);
  teardrop2.position.set(0.05, -0.16, 0);
  teardrop2.rotation.z = Math.PI;
  teardrop2.scale.set(scale, scale, scale);
  group.add(teardrop2);

  group.rotation.x = Math.PI;

  return group;
}
