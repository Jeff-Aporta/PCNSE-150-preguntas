import { useGlassColors, glassSurfaceSx } from "../glassSurface.js";

const { Box } = MaterialUI;

/** Panel tipo tool-panel / modal inner. */
export function GlassPanel({ tone = "hi", className = "", sx = {}, children, ...rest }) {
  const c = useGlassColors();
  return (
    <Box
      className={["isa-glass-panel", className].filter(Boolean).join(" ")}
      sx={glassSurfaceSx(c, { tone, radius: "14px", blur: 10, ...sx })}
      {...rest}
    >
      {children}
    </Box>
  );
}
