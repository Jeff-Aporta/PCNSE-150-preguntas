import { GlassSurface } from "./GlassSurface.jsx";

/** Barra horizontal (toolbar, export row). */
export function GlassToolbar({ className = "", sx = {}, children, ...rest }) {
  return (
    <GlassSurface
      tone="node"
      hover={false}
      blur={10}
      radius="0.75rem"
      className={["isa-glass-toolbar", className].filter(Boolean).join(" ")}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        p: { xs: 1, sm: 1.25 },
        mb: 2,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </GlassSurface>
  );
}
