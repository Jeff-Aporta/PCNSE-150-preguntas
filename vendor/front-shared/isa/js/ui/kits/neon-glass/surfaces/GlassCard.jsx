import { useGlassColors, glassCardSx } from "../glassSurface.js";

const { Paper } = MaterialUI;

export function GlassCard({ tone = "default", accent, hover = true, className = "", sx = {}, children, ...rest }) {
  const c = useGlassColors();
  return (
    <Paper
      variant="outlined"
      elevation={0}
      className={["isa-glass-card", className].filter(Boolean).join(" ")}
      sx={glassCardSx(c, { tone, accent, hover, ...sx })}
      {...rest}
    >
      {children}
    </Paper>
  );
}
