import { useGlassColors, glassCardSx, glassHeaderSx, glassInnerSx } from "../glassSurface.js";

const { Paper, Box, Typography, Stack } = MaterialUI;

/** Sección con header, barra de acento e icono (tk-doc SectionCard / chat conv-msg). */
export function GlassSection({
  title,
  icon = null,
  accent = "#1e90ff",
  tone = "default",
  sectionKey,
  className = "",
  headerSx = {},
  bodySx = {},
  sx = {},
  children,
}) {
  const c = useGlassColors();
  return (
    <Paper
      id={sectionKey ? `isa-glass-section-${sectionKey}` : undefined}
      variant="outlined"
      elevation={0}
      className={["isa-glass-section", className].filter(Boolean).join(" ")}
      sx={glassCardSx(c, { tone, accent, hover: true, mb: 2.5, ...sx })}
    >
      {title ? (
        <Box
          className="isa-glass-section__head"
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: 1.5,
            ...glassHeaderSx(c, accent),
            ...glassInnerSx(c, "blue"),
            ...headerSx,
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            {icon ? (
              <Box
                className="isa-glass-section__icon"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
                  color: "#fff",
                  boxShadow: c.dark ? `0 4px 12px ${accent}44` : "none",
                }}
              >
                {icon}
              </Box>
            ) : null}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: -0.2, color: c.text }}>
              {title}
            </Typography>
          </Stack>
        </Box>
      ) : null}
      <Box className="isa-glass-section__body" sx={{ p: { xs: 2, sm: 2.5 }, color: c.text, ...bodySx }}>
        {children}
      </Box>
    </Paper>
  );
}
