/** Una sola instancia React (stack.mjs → window.React) para blobs Babel + hooks. */
const R = globalThis.React;
if (!R?.useState) throw new Error("react-shim: ejecutar stack.mjs antes");
export default R;
export const {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
  useReducer,
  useId,
  Fragment,
  createElement,
  cloneElement,
  Children,
  Component,
  PureComponent,
  memo,
  forwardRef,
  lazy,
  Suspense,
  StrictMode,
} = R;
