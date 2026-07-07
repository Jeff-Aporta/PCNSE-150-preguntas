import { useGlassColors, glassInnerSx } from "../glassSurface.js";

const { Box } = MaterialUI;

/** Superficie anidada (filas, chips, nodos internos). */
export function GlassInner({ tone = "node", className = "", sx = {}, children, ...rest }) {
  const c = useGlassColors();
  return (
    <Box
      className={["isa-glass-inner", className].filter(Boolean).join(" ")}
      sx={glassInnerSx(c, tone, { borderRadius: "0.5rem", ...sx })}
      {...rest}
    >
      {children}
    </Box>
  );
}
