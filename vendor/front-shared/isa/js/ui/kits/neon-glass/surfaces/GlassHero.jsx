import { glassHeroSx } from "../glassSurface.js";

const { Box, useTheme } = MaterialUI;

/** Hero gradient con orbes decorativos (tk-doc HeroHeader). Neon glow solo en dark. */
export function GlassHero({ className = "", sx = {}, children, ...rest }) {
  const dark = useTheme().palette.mode === "dark";
  return (
    <Box
      className={["isa-glass-hero", className].filter(Boolean).join(" ")}
      sx={glassHeroSx(dark, { mb: 3, p: { xs: 2.5, sm: 3, md: 3.5 }, ...sx })}
      {...rest}
    >
      {dark ? (
        <>
          <Box
            className="isa-glass-hero__orb isa-glass-hero__orb--tr"
            aria-hidden
            sx={{
              position: "absolute",
              top: -40,
              right: -20,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              filter: "blur(2px)",
            }}
          />
          <Box
            className="isa-glass-hero__orb isa-glass-hero__orb--bl"
            aria-hidden
            sx={{
              position: "absolute",
              bottom: -60,
              left: -30,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(99,102,241,0.35)",
              filter: "blur(4px)",
            }}
          />
        </>
      ) : (
        <>
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: -40,
              right: -20,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(30,144,255,0.1)",
              filter: "blur(2px)",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              bottom: -60,
              left: -30,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(99,102,241,0.14)",
              filter: "blur(4px)",
            }}
          />
        </>
      )}
      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
}
