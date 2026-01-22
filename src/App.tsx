import { createComputed, createSignal, on, onCleanup, onMount, type Component } from 'solid-js';
import { BrickMap, BrickMapTextures } from './BrickMap';

const FOV_Y = 50.0;

const App: Component = () => {
  let [ canvas, setCanvas, ] = createSignal<HTMLCanvasElement>();
  let [ gl, setGl, ] = createSignal<WebGL2RenderingContext>();
  let brickMap = new BrickMap();
  let quadVertices = new Float32Array(12);
  let quadVerticesBuffer: WebGLBuffer | undefined = undefined;
  let positionLocation: number | undefined = undefined;
  let resolutionLocation: WebGLUniformLocation | null | undefined = undefined;
  let focalLengthLocation: WebGLUniformLocation | null | undefined = undefined;
  let modelViewMatrixLocation: WebGLUniformLocation | null | undefined = undefined;
  let brickMapTextures: BrickMapTextures | undefined = undefined;
  let angleLocation: WebGLUniformLocation | null | undefined = undefined;
  // test data
  function test_sdf(x: number, y: number, z: number) {
    let dx = x;
    let dy = y;
    let dz = z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) - 100.0;
  }
  for (let i = -105; i <= 105; ++i) {
    for (let j = -105; j <= 105; ++j) {
      for (let k = -105; k <= 105; ++k) {
        let a = test_sdf(i,j,k);
        a /= Math.sqrt(3);
        if (a < -1.0 || a > 1.0) {
          continue;
        }
        let val = 128 - Math.floor(Math.max(-1, Math.min(1, a)) * 127);
        if (val < 1) val = 1; 
        if (val > 255) val = 255;
        brickMap.set(
          512 + k,
          512 + j,
          512 + i,
          val,
        );
      }
    }
  }
  //
  let brickMapShaderCode = brickMap.writeShaderCode();
  let updateQuad = () => {
    let canvas2 = canvas();
    if (canvas2 == undefined) {
      return;
    }
    let gl2 = gl();
    if (gl2 == undefined) {
      return;
    }
    if (quadVerticesBuffer === undefined) {
      return;
    }
    if (positionLocation === undefined) {
      return;
    }
    if (resolutionLocation === undefined) {
      return;
    }
    if (focalLengthLocation === undefined) {
      return;
    }
    if (modelViewMatrixLocation === undefined) {
      return;
    }
    let width = canvas2.width;
    let height = canvas2.height;
    const focalLength = 0.5 * height / Math.tan(0.5 * FOV_Y * Math.PI / 180.0);
    quadVertices[0] = 0.0;
    quadVertices[1] = 0.0;
    quadVertices[2] = width;
    quadVertices[3] = 0.0;
    quadVertices[4] = width;
    quadVertices[5] = height;
    quadVertices[6] = 0.0;
    quadVertices[7] = 0.0;
    quadVertices[8] = width;
    quadVertices[9] = height;
    quadVertices[10] = 0.0;
    quadVertices[11] = height;
    gl2.enableVertexAttribArray(positionLocation);
    gl2.bindBuffer(gl2.ARRAY_BUFFER, quadVerticesBuffer);
    gl2.bufferData(gl2.ARRAY_BUFFER, quadVertices, gl2.DYNAMIC_DRAW);
    gl2.vertexAttribPointer(
      positionLocation,
      2,
      gl2.FLOAT,
      false,
      0,
      0,
    );
    gl2.disableVertexAttribArray(positionLocation);
    function createOrtho2D(left: number, right: number, bottom: number, top: number) {
        var near = -1, far = 1, rl = right-left, tb = top-bottom, fn = far-near;
        return [        2/rl,               0,              0,  0,
                          0,             2/tb,              0,  0,
                          0,                0,          -2/fn,  0,
            -(right+left)/rl, -(top+bottom)/tb, -(far+near)/fn,  1];
    }
    const modelViewMatrix = new Float32Array(
      createOrtho2D(
        0.0,
        width,
        0.0,
        height,
      ),
    );
    gl2.uniform2f(resolutionLocation, width, height);
    gl2.uniform1f(focalLengthLocation, focalLength);
    gl2.uniformMatrix4fv(
      modelViewMatrixLocation,
      false,
      modelViewMatrix,
    );
    gl2.viewport(0, 0, width, height);
    rerender();
  };
  let rerender: () => void;
  {
    let aboutToRender = false;
    rerender = () => {
      let gl2 = gl();
      if (gl2 == undefined) {
        return;
      }
      if (aboutToRender) {
        return;
      }
      aboutToRender = true;
      requestAnimationFrame(() => {
        if (quadVerticesBuffer === undefined) {
          return;
        }
        if (positionLocation === undefined) {
          return;
        }
        aboutToRender = false;
        gl2.enableVertexAttribArray(positionLocation);
        gl2.bindBuffer(gl2.ARRAY_BUFFER, quadVerticesBuffer);
        gl2.drawArrays(gl2.TRIANGLES, 0, 6);
        gl2.disableVertexAttribArray(positionLocation);
      });
    };
  }
  onMount(on(
    canvas,
    (canvas) => {
      if (canvas == undefined) {
        return;
      }
      let resizeObserver = new ResizeObserver(() => {
        let rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        updateQuad();
      });
      resizeObserver.observe(canvas);
      onCleanup(() => {
        resizeObserver.unobserve(canvas);
        resizeObserver.disconnect();
      });
      let gl2 = canvas.getContext("webgl2");
      if (gl2 == null) {
        return;
      }
      setGl(gl2);
    },
  ));
  createComputed(on(
    gl,
    (gl) => {
      if (gl == undefined) {
        return;
      }
      let vertexShader = gl.createShader(gl.VERTEX_SHADER);
      if (vertexShader == null) {
        return;
      }
      gl.shaderSource(vertexShader, `#version 300 es
        in vec4 aVertexPosition;
        uniform mat4 uModelViewMatrix;

        void main(void) {
          gl_Position = uModelViewMatrix * aVertexPosition;
        }
      `);
      gl.compileShader(vertexShader);
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the vertex shader: ' + gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
        return undefined;
      }
      let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (fragmentShader == null) {
        gl.deleteShader(vertexShader);
        return;
      }
      let fragmentShaderCode = `#version 300 es

precision highp float;
precision highp int;
precision highp usampler3D;
precision highp sampler3D;

uniform vec2 resolution;
uniform float uFocalLength;
uniform float uAngle;

out vec4 fragColour;

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
    vec3 p = vec3(uv.x*10240.0/3.0,uv.y*10240.0/3.0,201.0);
    float v = map(p);
    fragColour = vec4(0.0, 0.0, 0.5*(sin(v*0.015)+1.0), 1.0);
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
    fragColour = vec4(0.2, 0.2, 0.2, 1.0);
    return;
  }
  vec3 p = ro + rd*t;
  vec3 n = normal(p);
  float s = 0.8*dot(n,normalize(vec3(1,1,1))) + 0.2;
  vec4 c = vec4(1.0, 1.0, 1.0, 1.0);
  c = vec4(c.rgb * s, c.a);
  fragColour = c;
}
      `;
      console.log(
        fragmentShaderCode
          .split("\n")
          .map((line, idx) => `${idx+1}: ${line}`)
          .join("\n")
      );
      gl.shaderSource(fragmentShader, fragmentShaderCode);
      gl.compileShader(fragmentShader);
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the fragment shader: ' + gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader);
        return undefined;
      }
      let shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);
      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        gl.detachShader(shaderProgram, vertexShader);
        gl.detachShader(shaderProgram, fragmentShader);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteProgram(shaderProgram)
        return undefined;
      }
      gl.useProgram(shaderProgram);
      brickMapTextures = brickMap.initTextures(gl, shaderProgram);
      positionLocation = gl.getAttribLocation(shaderProgram, "aVertexPosition");
      resolutionLocation = gl.getUniformLocation(shaderProgram, "resolution");
      focalLengthLocation = gl.getUniformLocation(shaderProgram, "uFocalLength");
      modelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
      angleLocation = gl.getUniformLocation(shaderProgram, "uAngle");
      quadVerticesBuffer = gl.createBuffer();
      updateQuad();
    },
  ));
  let drawInBrickmap = (x: number, y: number) => {
    let cx = 512 + Math.round(x);
    let cy = 512 + Math.round(y);
    let cz = 512;
    let r = 5;
    for (let i = -r-2; i <= r+2; ++i) {
      for (let j = -r-2; j <= r+2; ++j) {
        for (let k = -r-2; k <= r+2; ++k) {
          let a = Math.sqrt(i*i + j*j + k*k) - r;
          a /= Math.sqrt(3);
          if (a < -1.0 || a > 1.0) {
            continue;
          }
          let val = 128 - Math.floor(Math.max(-1, Math.min(1, a)) * 127);
          if (val < 1) val = 1; 
          if (val > 255) val = 255;
          let x = cx + k;
          let y = cy + j;
          let z = cz + i;
          if (
            x < 0 || x >= 1024 ||
            y < 0 || y >= 1024 ||
            z < 0 || z >= 1024
          ) {
            continue;
          }
          brickMap.set(
            x,
            y,
            z,
            val,
          );
        }
      }
    }
  };
  let strokeInBrickmap = (x1: number, y1: number, x2: number, y2: number) => {
    let pt1x = 512 + Math.round(x1);
    let pt1y = 512 + Math.round(y1);
    let pt1z = 512;
    let pt2x = 512 + Math.round(x2);
    let pt2y = 512 + Math.round(y2);
    let pt2z = 512;
    let r = 20;
    let ux = pt2x - pt1x;
    let uy = pt2y - pt1y;
    let uz = pt2z - pt1z;
    let uu = ux * ux + uy * uy + uz * uz;
    let sdf = (x: number, y: number, z: number) => {
      let t = ((x - pt1x) * ux + (y - pt1y) * uy + (z - pt1z) * uz) / uu;
      t = Math.max(0.0, Math.min(1.0, t));
      let px = pt1x + ux * t;
      let py = pt1y + uy * t;
      let pz = pt1z + uz * t;
      let dx = x - px;
      let dy = y - py;
      let dz = z - pz;
      return Math.sqrt(dx*dx + dy*dy + dz*dz) - r;
    };
    let min_x = Math.min(pt1x, pt2x) - r;
    let max_x = Math.max(pt1x, pt2x) + r;
    let min_y = Math.min(pt1y, pt2y) - r;
    let max_y = Math.max(pt1y, pt2y) + r;
    let min_z = Math.min(pt1z, pt2z) - r;
    let max_z = Math.max(pt1z, pt2z) + r;
    for (let i = min_z-2; i <= max_z+2; ++i) {
      for (let j = min_y-2; j <= max_y+2; ++j) {
        for (let k = min_x-2; k <= max_x+2; ++k) {
          if (
            i < 0 || i >= 1024 ||
            j < 0 || j >= 1024 ||
            k < 0 || k >= 1024
          ) {
            continue;
          }
          let a = sdf(k, j, i);
          a /= Math.sqrt(3);
          if (a < -1.0 || a > 1.0) {
            continue;
          }
          let val = 128 - Math.floor(Math.max(-1, Math.min(1, a)) * 127);
          if (val < 1) val = 1; 
          if (val > 255) val = 255;
          let oldVal = brickMap.get(k, j, i);
          if (oldVal != 0) {
            val = Math.max(val, oldVal);
          }
          brickMap.set(
            k,
            j,
            i,
            val,
          );
        }
      }
    }
  };
  let lastDrawX: number | undefined = undefined;
  let lastDrawY: number | undefined = undefined;
  let onPointerDown = (e: PointerEvent) => {
    let canvas2 = canvas();
    if (canvas2 == undefined) {
      return;
    }
    canvas2.setPointerCapture(e.pointerId);
    let gl2 = gl();
    if (gl2 == undefined) {
      return undefined;
    }
    if (brickMapTextures == undefined) {
      return;
    }
    let rect = canvas2.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    let x2 = x - 0.5 * rect.width;
    let y2 = -y + 0.5 * rect.height;
    lastDrawX = x2;
    lastDrawY = y2;
    drawInBrickmap(x2, y2);
    brickMap.updateTextures(gl2, brickMapTextures);
    rerender();
  }
  let onPointerMove = (e: PointerEvent) => {
    if (lastDrawX == undefined) {
      return;
    }
    if (lastDrawY == undefined) {
      return;
    }
    let canvas2 = canvas();
    if (canvas2 == undefined) {
      return;
    }
    let gl2 = gl();
    if (gl2 == undefined) {
      return undefined;
    }
    if (brickMapTextures == undefined) {
      return;
    }
    let rect = canvas2.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    let x2 = x - 0.5 * rect.width;
    let y2 = -y + 0.5 * rect.height;
    let dx = x2 - lastDrawX;
    let dy = y2 - lastDrawY;
    let distSquared = dx * dx + dy * dy;
    if (distSquared <= 5*5) {
      return;
    }
    strokeInBrickmap(lastDrawX, lastDrawY, x2, y2);
    lastDrawX = x2;
    lastDrawY = y2;
    brickMap.updateTextures(gl2, brickMapTextures);
    rerender();
  };
  let onPointerUp = (e: PointerEvent) => {
    let canvas2 = canvas();
    if (canvas2 == undefined) {
      return;
    }
    canvas2.releasePointerCapture(e.pointerId);
    lastDrawX = undefined;
    lastDrawY = undefined;
  };
  let spin = () => {
    let angle = 0.0;
    let animate = () => {
      let gl2 = gl();
      if (gl2 == undefined) {
        return;
      }
      if (angleLocation === undefined) {
        return;
      }
      angle += 10.0;
      gl2.uniform1f(angleLocation, angle);
      rerender();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <canvas
        ref={setCanvas}
        style={{
          position: "absolute",
          left: "0",
          top: "0",
          width: "100%",
          height: "100%",
          "touch-action": "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <div
        class="ml-2 mt-2"
        style={{
          position: "absolute",
          left: "0",
          top: "0",
        }}
      >
        <button class="btn btn-primary">Draw</button>
        <button
          class="btn btn-primary ml-2"
          onClick={() => spin()}
        >
          Spin
        </button>
      </div>
    </div>
  );
};

export default App;
