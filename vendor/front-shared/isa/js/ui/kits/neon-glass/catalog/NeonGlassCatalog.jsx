import { GlassPageSurface } from "../surfaces/GlassPageSurface.jsx";
import { GlassHero } from "../surfaces/GlassHero.jsx";
import { GlassToolbar } from "../surfaces/GlassToolbar.jsx";
import { GlassCard } from "../surfaces/GlassCard.jsx";
import { GlassPanel } from "../surfaces/GlassPanel.jsx";
import { GlassSection } from "../surfaces/GlassSection.jsx";
import { GlassSurface } from "../surfaces/GlassSurface.jsx";
import { GlassInner } from "../surfaces/GlassInner.jsx";
import { GlassTableWrap } from "../surfaces/GlassTableWrap.jsx";
import { GLASS_TONES, NEON_COLORS } from "../tokens.js";

const { Box, Typography, Stack, Chip, Table, TableHead, TableBody, TableRow, TableCell } = MaterialUI;

function SwIcon({ icon, size = 18 }) {
  const BagIcon = globalThis.ISA?.UI?.Icon;
  if (BagIcon) return React.createElement(BagIcon, { icon, size });
  return React.createElement("iconify-icon", { icon, style: { fontSize: size } });
}

function CatalogBlock({ title, desc, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.12em", fontWeight: 700 }}>
        {title}
      </Typography>
      {desc ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, opacity: 0.8 }}>
          {desc}
        </Typography>
      ) : null}
      {children}
    </Box>
  );
}

function PlannedItem({ label, note }) {
  return (
    <GlassInner tone="chip" sx={{ p: 1.25, opacity: 0.85 }}>
      <Typography variant="body2" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {note}
      </Typography>
    </GlassInner>
  );
}

/** Catálogo visual de superficies y roadmap estético. */
export function NeonGlassCatalog() {
  return (
    <GlassPageSurface sx={{ maxWidth: 960, mx: "auto" }}>
      <GlassHero>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          ISAFront.Glass
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 520 }}>
          Superficies glass neon en front-shared. Glow y orbes en dark; glass limpio en light.
        </Typography>
      </GlassHero>

      <GlassToolbar>
        <Chip size="small" label="Surfaces" color="primary" variant="outlined" />
        <Chip size="small" label={`${GLASS_TONES.length} tones`} variant="outlined" />
        <Box sx={{ ml: "auto" }}>
          <Typography variant="caption" color="text.secondary">
            Toggle tema en AppBar
          </Typography>
        </Box>
      </GlassToolbar>

      <CatalogBlock title="Page surface" desc="GlassPageSurface / tk-doc-web-surface — fondo estándar del ecosistema.">
        <Typography variant="body2" color="text.secondary">
          Mesh + viñeta tk-doc. Esta página usa GlassPageSurface como contenedor.
        </Typography>
      </CatalogBlock>

      <CatalogBlock title="Page surface + orbs" desc="GlassPageSurface — prop orbs para glow decorativo en dark.">
        <GlassPageSurface orbs sx={{ minHeight: 120, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Mismo mesh tk-doc; orbs opcionales sin componente aparte.
          </Typography>
        </GlassPageSurface>
      </CatalogBlock>

      <CatalogBlock title="Cards & panels" desc="GlassCard, GlassPanel, GlassSurface.">
        <Stack spacing={1.5}>
          <GlassCard sx={{ p: 2 }}>
            <Typography variant="subtitle2">GlassCard</Typography>
            <Typography variant="body2" color="text.secondary">
              Card con hover lift; neon glow en dark.
            </Typography>
          </GlassCard>
          <GlassPanel sx={{ p: 2 }}>
            <Typography variant="subtitle2">GlassPanel</Typography>
            <Typography variant="body2" color="text.secondary">
              Panel tipo tool-panel / gate login.
            </Typography>
          </GlassPanel>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {GLASS_TONES.map((tone) => (
              <GlassSurface key={tone} tone={tone} sx={{ p: 1.25, minWidth: 100 }}>
                <Typography variant="caption" fontWeight={700}>
                  {tone}
                </Typography>
              </GlassSurface>
            ))}
          </Stack>
        </Stack>
      </CatalogBlock>

      <CatalogBlock title="Section" desc="GlassSection — header con acento (tk-doc, chat cards).">
        <GlassSection
          title="Detalle conversación"
          accent={NEON_COLORS.blue}
          icon={<SwIcon icon="mdi:message-text-outline" size={18} />}
          sectionKey="demo"
        >
          <Typography variant="body2" color="text.secondary">
            Contenido de la sección. Reutilizable en swagger, tk-doc, chat.
          </Typography>
        </GlassSection>
      </CatalogBlock>

      <CatalogBlock title="Table wrap" desc="GlassTableWrap — tablas compactas (params URL, métricas).">
        <GlassTableWrap>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Parámetro</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Valor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <code>iconversacion</code>
                </TableCell>
                <TableCell>integer</TableCell>
                <TableCell>ID de conversación</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </GlassTableWrap>
      </CatalogBlock>

      <CatalogBlock title="Roadmap estético" desc="Misma familia visual — próximas piezas.">
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {[
            ["GlassAccordion", "Operaciones swagger / respuestas"],
            ["GlassChip", "Badges método HTTP, tags"],
            ["GlassButton", "Primary gradient + glow"],
            ["GlassDialog", "JWT modal, pickers"],
            ["GlassInput", "Compose chat, try-it-out"],
            ["GlassTabs", "Tabs operación / herramientas"],
          ].map(([label, note]) => (
            <Box key={label} sx={{ flex: "1 1 280px", maxWidth: "100%" }}>
              <PlannedItem label={label} note={note} />
            </Box>
          ))}
        </Stack>
      </CatalogBlock>
    </GlassPageSurface>
  );
}
