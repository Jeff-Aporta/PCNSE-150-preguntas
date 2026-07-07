import { useGlassColors, glassSurfaceSx } from "../glassSurface.js";

const { Box } = MaterialUI;

/** Superficie glass base — panel, contenedor, toolbar. */
export function GlassSurface({
  tone = "default",
  accent,
  neon = "auto",
  hover = false,
  blur = 16,
  radius = "0.75rem",
  className = "",
  sx = {},
  children,
  component = Box,
  ...rest
}) {
  const c = useGlassColors();
  const Component = component;
  return (
    <Component
      className={["isa-glass-surface", className].filter(Boolean).join(" ")}
      sx={glassSurfaceSx(c, { tone, accent, neon, hover, blur, radius, ...sx })}
      {...rest}
    >
      {children}
    </Component>
  );
}
