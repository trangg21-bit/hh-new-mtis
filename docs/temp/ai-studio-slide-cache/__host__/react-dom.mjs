const host = globalThis.__OPEN_SLIDE_HOST__;
if (!host?.ReactDOM) throw new Error("Open-slide host not initialized");
const ReactDOM = host.ReactDOM?.default ?? host.ReactDOM;
export default ReactDOM;
export const {
  createPortal,
  flushSync,
  hydrate,
  preconnect,
  prefetchDNS,
  render,
  unmountComponentAtNode,
  unstable_batchedUpdates,
  useFormStatus,
  version,
} = ReactDOM;
