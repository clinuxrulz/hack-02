import { createSignal, on, onCleanup, onMount, type Component } from 'solid-js';

const App: Component = () => {
  let [ canvas, setCanvas, ] = createSignal<HTMLCanvasElement>();
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
      });
      resizeObserver.observe(canvas);
      onCleanup(() => {
        resizeObserver.unobserve(canvas);
        resizeObserver.disconnect();
      });
    },
  ));
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

export default App;
