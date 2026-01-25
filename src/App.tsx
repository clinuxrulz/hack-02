import { createComputed, createSignal, on, onCleanup, onMount, type Component } from 'solid-js';
import { BrickMap, BrickMapTextures } from './BrickMap';
import RendererView, { RendererViewController } from './RendererView';

const FOV_Y = 50.0;

const App: Component = () => {
  let [ renderDiv, setRenderDiv, ] = createSignal<HTMLDivElement>();
  let [ rendererViewController, setRendererViewController, ] = createSignal<RendererViewController>();
  let brickMap = new BrickMap();
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
  let rerender = () => {
    let controller = rendererViewController();
    controller?.rerender?.();
  };
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
    let renderDiv2 = renderDiv();
    if (renderDiv2 == undefined) {
      return;
    }
    let controller = rendererViewController();
    if (controller == undefined) {
      return;
    }
    renderDiv2.setPointerCapture(e.pointerId);
    let rect = renderDiv2.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    let x2 = x - 0.5 * rect.width;
    let y2 = -y + 0.5 * rect.height;
    lastDrawX = x2;
    lastDrawY = y2;
    drawInBrickmap(x2, y2);
    controller.onBrickMapChanged();
  }
  let onPointerMove = (e: PointerEvent) => {
    if (lastDrawX == undefined) {
      return;
    }
    if (lastDrawY == undefined) {
      return;
    }
    let renderDiv2 = renderDiv();
    if (renderDiv2 == undefined) {
      return;
    }
    let controller = rendererViewController();
    if (controller == undefined) {
      return;
    }
    let rect = renderDiv2.getBoundingClientRect();
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
    controller.onBrickMapChanged();
  };
  let onPointerUp = (e: PointerEvent) => {
    let renderDiv2 = renderDiv();
    if (renderDiv2 == undefined) {
      return;
    }
    renderDiv2.releasePointerCapture(e.pointerId);
    lastDrawX = undefined;
    lastDrawY = undefined;
  };
  let spin = () => {
    let angle = 0.0;
    let animate = () => {
      /*
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
      requestAnimationFrame(animate);*/
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
      <div
        ref={setRenderDiv}
        style={{
          position: "absolute",
          left: "0",
          top: "0",
          right: "0",
          bottom: "0",
          "touch-action": "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <RendererView
          brickMap={brickMap}
          onInit={(controller) => {
            setRendererViewController(controller);
          }}
        />
      </div>
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
