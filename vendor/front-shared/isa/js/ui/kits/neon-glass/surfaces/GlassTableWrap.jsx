import { GlassSurface } from "./GlassSurface.jsx";

/** Wrapper compacto para tablas / listas (swagger params, tk tables). */
export function GlassTableWrap({ className = "", sx = {}, children, ...rest }) {
  return (
    <GlassSurface
      tone="node"
      hover={false}
      blur={8}
      radius="0.75rem"
      className={["isa-glass-table-wrap", className].filter(Boolean).join(" ")}
      sx={{ overflow: "hidden", ...sx }}
      {...rest}
    >
      {children}
    </GlassSurface>
  );
}
