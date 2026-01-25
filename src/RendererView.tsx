import { batch, Component, createSignal, onCleanup, onMount } from "solid-js";
import * as THREE from "three";
import { BrickMap } from "./BrickMap";
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

const FOV_Y = 50.0;

export type RendererViewController = {
  onBrickMapChanged: () => void,
  rerender: () => void,
};

const RendererView: Component<{
  brickMap: BrickMap,
  onInit: (controller: RendererViewController) => void,
}> = (props) => {
  let [ canvas, setCanvas, ] = createSignal<HTMLCanvasElement>();
  let [ camera, setCamera, ] = createSignal<THREE.PerspectiveCamera>();
  let [ renderer, setRenderer, ] = createSignal<THREE.WebGLRenderer>();
  let scene = new THREE.Scene();
  let brickMapShaderCode = props.brickMap.writeShaderCode();
  let fragmentShaderCode = `
precision highp float;
precision highp int;
precision highp usampler3D;
precision highp sampler3D;

uniform vec2 resolution;
uniform float uFocalLength;
uniform float uAngle;

//out vec4 fragColour;

${brickMapShaderCode}

float map2(vec3 p) {
  p += 512.0 * VOXEL_SIZE;
  return abs(length(p - vec3(512.0*VOXEL_SIZE)) - 100.0 * VOXEL_SIZE);
}

const int MAX_STEPS = 200;
const float MIN_DIST = 5.0;
const float MAX_DIST = 10000.0;

bool march(vec3 ro, vec3 rd, out float t) {
    t = 0.0;
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        
        if(d < MIN_DIST) {
            return true;
        }
        
        t += d;
        
        if(t > MAX_DIST) {
            break;
        }
    }
    return false;
}

vec3 normal(vec3 p) {
    const float eps = 0.1;
    const vec2 h = vec2(eps, 0);
    return normalize(vec3(
        map(p + h.xyy) - map(p - h.xyy),
        map(p + h.yxy) - map(p - h.yxy),
        map(p + h.yyx) - map(p - h.yyx)
    ));
}

void main(void) {
  float fl = uFocalLength;
  float mn = min(resolution.x, resolution.y);
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / mn;
  if (false) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
  if (false) {
    vec3 p = vec3(uv.x*10240.0/3.0,uv.y*10240.0/3.0,201.0);
    float v = map(p);
    gl_FragColor = vec4(0.0, 0.0, 0.5*(sin(v*0.015)+1.0), 1.0);
    return;
  }
  float ca = cos(uAngle * acos(-1.0) / 180.0);
  float sa = sin(uAngle * acos(-1.0) / 180.0);
  vec3 w = normalize(vec3(sa, 0.0, ca));
  vec3 u = normalize(cross(vec3(0,1,0),w));
  vec3 v = cross(w,u);
  vec3 ro = vec3(5000.0 * sa, 0.0, 5000.0 * ca);
  vec3 rd = normalize(
    (gl_FragCoord.x - 0.5 * resolution.x) * u +
    (gl_FragCoord.y - 0.5 * resolution.y) * v +
    -fl * w
  );
  float t = 0.0;
  bool hit = march(ro, rd, t);
  if (!hit) {
    gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);
    return;
  }
  vec3 p = ro + rd*t;
  vec3 n = normal(p);
  float s = 0.8*dot(n,normalize(vec3(1,1,1))) + 0.2;
  vec4 c = vec4(1.0, 1.0, 1.0, 1.0);
  c = vec4(c.rgb * s, c.a);
  gl_FragColor = c;
}
`;
  console.log(
    fragmentShaderCode
      .split("\n")
      .map((line, idx) => `${idx+1}: ${line}`)
      .join("\n")
  );
  let params: THREE.ShaderMaterialParameters = {
    uniforms: {
      resolution: { value: new THREE.Vector2(), },
      uFocalLength: { value: 0.0, },
    },
    fragmentShader: fragmentShaderCode,
  };
  let brickMapTextures = props.brickMap.initTexturesThreeJs(params);
  let material = new THREE.ShaderMaterial(params);
  let fullScreenQuad = new FullScreenQuad(material);
  let rerender: () => void;
  {
    let isRendering = false;
    rerender = () => {
      if (isRendering) {
        return;
      }
      isRendering = true;
      requestAnimationFrame(() => {
        let renderer2 = renderer();
        if (renderer2 == undefined) {
          return;
        }
        let camera2 = camera();
        if (camera2 == undefined) {
          return;
        }
        fullScreenQuad.render(renderer2);
        //renderer2.render(scene, camera2);
        isRendering = false;
      });
    };
  }
  props.onInit({
    rerender,
    onBrickMapChanged() {
      props.brickMap.updateTexturesThreeJs(brickMapTextures);
      rerender();
    },
  });
  onMount(() => {
    let canvas2 = canvas();
    if (canvas2 == undefined) {
      return;
    }
    let camera = new THREE.PerspectiveCamera(
      FOV_Y,
    );
    let renderer = new THREE.WebGLRenderer({
      canvas: canvas2,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    let resizeObserver = new ResizeObserver(() => {
      let rect = canvas2.getBoundingClientRect();
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      let width = rect.width * window.devicePixelRatio;
      let height = rect.height * window.devicePixelRatio;
      let focalLength = 0.5 * height / Math.tan(0.5 * FOV_Y * Math.PI / 180.0);
      renderer.setSize(rect.width, rect.height);
      material.uniforms.resolution.value.set(
        width,
        height,
      );
      material.uniforms.uFocalLength.value = focalLength;
      rerender();
    });
    resizeObserver.observe(canvas2);
    onCleanup(() => {
      resizeObserver.unobserve(canvas2);
      resizeObserver.disconnect();
    });
    batch(() => {
      setCamera(camera);
      setRenderer(renderer);
    });
    rerender();
  });
  return (
    <canvas
      ref={setCanvas}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};

export default RendererView;
