const host = globalThis.__OPEN_SLIDE_HOST__;
if (!host?.jsxRuntime) throw new Error("Open-slide host not initialized");
export const { jsx, jsxs, Fragment } = host.jsxRuntime;
