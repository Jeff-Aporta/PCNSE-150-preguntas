/**
 * Espejo cliente del cat?logo de capacidades (solo mensajes UI).
 * La autorizaci?n real la resuelve el servicio de acceso en BD_AUTH.
 */
export const CAPABILITY_CATALOG = [
  {
    id: "sql.exec.isa",
    label: "Ejecutar SQL en bit?cora",
    denyLoggedOut: "Inicia sesi?n para ejecutar consultas SQL de la bit?cora",
    denyForbidden: "No tienes permiso para ejecutar SQL en la bit?cora",
  },
  {
    id: "patyia.instrucciones.read",
    label: "Consultar instrucciones PatyIA staging",
    denyLoggedOut: "Inicia sesi?n para consultar instrucciones PatyIA",
    denyForbidden: "No tienes permiso para consultar instrucciones PatyIA",
  },
  {
    id: "patyia.instrucciones.publish",
    label: "Publicar instrucciones PatyIA staging",
    denyLoggedOut: "Inicia sesi?n para guardar instrucciones",
    denyForbidden: "No tienes permiso para publicar instrucciones PatyIA",
  },
  {
    id: "patyia.chat.interact",
    label: "Enviar mensajes en chat PatyIA staging",
    denyLoggedOut: "Inicia sesi?n para chatear con PatyIA",
    denyForbidden: "No tienes permiso para enviar mensajes en PatyIA",
  },
  {
    id: "patyia.chat.audit",
    label: "Auditar conversaciones PatyIA staging",
    denyLoggedOut: "Inicia sesi?n para auditar conversaciones",
    denyForbidden: "No tienes permiso para auditar conversaciones ajenas",
  },
  {
    id: "patyia.conversacion.log",
    label: "Consultar log de conversaci?n PatyIA",
    denyLoggedOut: "Inicia sesi?n para consultar logs de conversaci?n",
    denyForbidden: "No tienes permiso para consultar logs PatyIA",
  },
  {
    id: "patyia.scrum",
    label: "Tablero Scrum (isa-patyia, en desarrollo)",
    denyLoggedOut: "Inicia sesión para crear o editar tableros DevFlow",
    denyForbidden: "En desarrollo",
  },
  {
    id: "langlab.guardar",
    label: "Guardar instrucciones de prompts",
    denyLoggedOut: "Inicia sesi?n para guardar instrucciones",
    denyForbidden: "No tienes permiso para guardar instrucciones",
  },
  {
    id: "signalr",
    label: "Notificaciones en tiempo real",
    denyLoggedOut: "Inicia sesi?n para recibir notificaciones en tiempo real",
    denyForbidden: "Sin permiso para notificaciones en tiempo real",
  },
  {
    id: "infra.target.switch",
    label: "Cambiar entorno de despliegue (Local / Producci?n)",
    denyLoggedOut: "Inicia sesi?n para cambiar el entorno",
    denyForbidden: "Tu rol no permite cambiar el entorno de despliegue",
  },
  {
    id: "session.view_as",
    label: "Suplantación de usuario (auditoría / QA, solo admin)",
    denyLoggedOut: "Inicia sesión para usar suplantación",
    denyForbidden: "Solo administradores pueden suplantar a otros usuarios",
  },
  {
    id: "patyia.jwt.admin",
    label: "Administrar JWT portal PatyIA de otros usuarios",
    denyLoggedOut: "Inicia sesi?n para administrar JWT de portal",
    denyForbidden: "Solo administradores pueden usar JWT de otros usuarios",
  },
];

const BY_ID = new Map(CAPABILITY_CATALOG.map((c) => [c.id, c]));

export function getCapabilityMeta(id) {
  return BY_ID.get(id);
}

export function blockReasonFor(capId, { loggedIn, username }) {
  const meta = BY_ID.get(capId);
  if (!meta) return "Permiso no configurado";
  if (!loggedIn) return meta.denyLoggedOut;
  if (username) {
    return meta.denyForbidden;
  }
  return meta.denyForbidden;
}

/** Alias legacy ? capacidad can?nica. */
export const LEGACY_CAP_MAP = {
  ejecutar_sql: "sql.exec.isa",
  ejecutar_mssql: "patyia.instrucciones.publish",
  ejecutar_mssql_instrucciones: "patyia.instrucciones.publish",
  guardar_langlab: "langlab.guardar",
};

export function resolveCapId(capOrLegacy) {
  return LEGACY_CAP_MAP[capOrLegacy] || capOrLegacy;
}
