/**
 * ISA Front — punto de entrada ESM (runtime, sin build).
 * jsDelivr prod: …/cdn/_dist/isa/js/index.min.js (boot-helper)
 */
import { CDN_BASE, UI_CDN_BASE, MAIN_ORCHESTRATOR_URL_LOCAL, MAIN_ORCHESTRATOR_URL_PROD, GATEWAY_URL_LOCAL, GATEWAY_URL_PROD } from "./core/config/constants.js";
import { isaCssUrl, isaIndexUrl, useCdnDist, CDN_DIST_ISA } from "./core/config/cdn-assets.js";
import { createApiConfig, registerConfig, initGatewayPreference } from "./core/config/config.js";
import { rewriteFlsItem, rewriteViaGateway } from "./core/http/gateway-url.js";
import { createAuth, registerAuth } from "./core/auth/auth.js";
import { makeDodgerTheme, createThemeApi, registerTheme } from "./ui/theme.js";
import { createWidgets, registerWidgets } from "./ui/widgets.js";
import { createLoginGates, registerLoginGates } from "./ui/kits/neon-glass/login/login-gate.js";
import { createLoginButton, registerLoginButton } from "./ui/kits/neon-glass/login/login-button.js";
import {
  createLoginFormFields,
  createLoginPasswordField,
  createLoginFormActions,
  createLoginActionButtons,
  createLoginPageFormComponent,
  registerLoginPageForm,
  loginFormContentSx,
  loginFormActionsSx,
} from "./ui/kits/neon-glass/login/login-form-fields.js";
import { registerApp } from "./core/boot/register-app.js";
import { REALTIME, REALTIME_CAP, wsUrlFromHttpBase, createRealtime, registerRealtime, REALTIME_EVENT } from "./core/realtime/realtime.js";
import { showToast, registerToast, TOAST_EVENT } from "./ui/toast.js";
import { createSqlExec, registerSqlExec } from "./ui/sql-exec.js";
import { registerCodeMirror } from "./ui/code-mirror.js";
import { CAPABILITY_CATALOG, blockReasonFor, resolveCapId } from "./core/caps/capabilities.js";
import { sanitizeUserMessage } from "./core/util/sanitize-user-message.js";
import {
  DEFAULT_FETCH_TIMEOUT_MS,
  isDevHost,
  localDevHint,
  sanitizeApiError,
  normalizeApiPath,
  apiUrl,
  wrapFetchError,
  fetchRaw,
  parseJsonResponse,
  basesFor,
  createCapFetch,
  createApiFetch,
  encodeSqlQueryParam,
  rowVal,
  humanPermissionError,
  handleApiError,
} from "./core/http/api-http.js";
import { createServiceSession } from "./core/auth/service-session.js";
import { buildCapEndpointMap, canAny } from "./core/caps/cap-endpoints.js";
import { getReact, getReactDOM, getMaterialUI } from "./core/boot/runtime.js";
import { createUrlState, b64urlEncode, b64urlDecode, goBrandHome, BRAND_HOME_EVENT } from "./core/platform/url-state.js";
import { createPlatformBridge } from "./core/platform/platform-bridge.js";
import { migrateLegacyGatewayKeys, GATEWAY_LEGACY_LS_KEYS } from "./core/http/gateway-legacy.js";
import {
  registerFeedback,
  registerFeedbackGlobal,
  createToastApi,
  createProcessApi,
} from "./ui/feedback/register.js";
import {
  toastSuccess,
  toastError,
  toastInfo,
  toastWarning,
  toastShow,
  requestConfirm,
  FEEDBACK_TOAST_EVENT,
  toastFromPayload,
} from "./ui/feedback/toast-bus.js";
import { createProcessRunner, FEEDBACK_PROCESS_EVENT } from "./ui/feedback/process-bus.js";
import {
  formatLocalDate,
  formatLocalDateTime,
  stripContapymeEmail,
  normalizeContapymeLoginId,
  formatSessionDisplayName,
  formatSessionChipLabel,
  resolveSessionHeaderLabel,
} from "./core/util/format.js";
import { estimatePromptTokens } from "./core/util/prompt-tokens.js";
import {
  ensureLazyStylesheet,
  loadLazyScript,
  loadLazyScriptsSequential,
  ensureCodeMirrorLoaded,
  ensureCodeMirrorStyles,
  ensureMarked,
} from "./core/util/lazy-assets.js";
import { mdToHtml } from "./core/util/markdown.js";
import {
  LOGIN_SUBTITLE_DEFAULT,
  loginPageSx,
  loginCardSx,
  loginHeaderBandSx,
  loginIconBoxSx,
  LoginHeaderBand,
  contapymeLoginTextFieldProps,
  CONTAPYME_LOGIN_ID_HELPER,
  loginDialogProps,
  createLoginIcon,
  resolveLoginUi,
} from "./ui/kits/neon-glass/login/login-surface.js";
import {
  GLASS_CARD_CLASS,
  glassCardMesh,
  glassCardSx,
  glassCardPaperProps,
} from "./ui/kits/neon-glass/glass-card-surface.js";
import { attachDefaultKit, NEON_GLASS_KIT_ID } from "./ui/kits/registry.js";
import { ensureKitCss, loadKitModule } from "./ui/kits/kit-assets.js";

window.ISAFront = {
  ...(typeof window !== "undefined" && window.ISAFront ? window.ISAFront : {}),
  CDN_BASE,
  CDN_DIST_ISA,
  uiBase: UI_CDN_BASE,
  cssUrl: isaCssUrl("base.css"),
  isaIndexUrl,
  useCdnDist,
  ensureKitCss,
  loadKitModule,
  MAIN_ORCHESTRATOR_URL_PROD,
  MAIN_ORCHESTRATOR_URL_LOCAL,
  GATEWAY_URL_PROD,
  GATEWAY_URL_LOCAL,
  rewriteViaGateway,
  rewriteFlsItem,
  createApiConfig,
  registerConfig,
  initGatewayPreference,
  createAuth,
  registerAuth,
  makeDodgerTheme,
  createThemeApi,
  registerTheme,
  createWidgets,
  registerWidgets,
  createLoginGates,
  registerLoginGates,
  registerApp,
  REALTIME,
  REALTIME_CAP,
  REALTIME_EVENT,
  wsUrlFromHttpBase,
  createRealtime,
  registerRealtime,
  showToast,
  registerToast,
  TOAST_EVENT,
  formatLocalDate,
  formatLocalDateTime,
  stripContapymeEmail,
  normalizeContapymeLoginId,
  formatSessionDisplayName,
  formatSessionChipLabel,
  resolveSessionHeaderLabel,
  estimatePromptTokens,
  ensureLazyStylesheet,
  loadLazyScript,
  loadLazyScriptsSequential,
  ensureCodeMirrorLoaded,
  ensureCodeMirrorStyles,
  ensureMarked,
  mdToHtml,
  CAPABILITY_CATALOG,
  blockReasonFor,
  resolveCapId,
  sanitizeUserMessage,
  sanitizeApiError,
  normalizeApiPath,
  DEFAULT_FETCH_TIMEOUT_MS,
  isDevHost,
  localDevHint,
  apiUrl,
  wrapFetchError,
  fetchRaw,
  parseJsonResponse,
  basesFor,
  createCapFetch,
  createApiFetch,
  encodeSqlQueryParam,
  rowVal,
  humanPermissionError,
  handleApiError,
  createServiceSession,
  buildCapEndpointMap,
  canAny,
  getReact,
  getReactDOM,
  getMaterialUI,
  createUrlState,
  b64urlEncode,
  b64urlDecode,
  goBrandHome,
  BRAND_HOME_EVENT,
  createPlatformBridge,
  migrateLegacyGatewayKeys,
  GATEWAY_LEGACY_LS_KEYS,
  Runtime: { getReact, getReactDOM, getMaterialUI },
  createSqlExec,
  registerSqlExec,
  registerCodeMirror,
  registerFeedback,
  registerFeedbackGlobal,
  createToastApi,
  createProcessApi,
  createProcessRunner,
  toastSuccess,
  toastError,
  toastInfo,
  toastWarning,
  toastShow,
  requestConfirm,
  FEEDBACK_TOAST_EVENT,
  FEEDBACK_PROCESS_EVENT,
  LOGIN_SUBTITLE_DEFAULT,
  loginPageSx,
  loginCardSx,
  loginHeaderBandSx,
  LoginHeaderBand,
  contapymeLoginTextFieldProps,
  CONTAPYME_LOGIN_ID_HELPER,
  loginDialogProps,
  createLoginIcon,
  resolveLoginUi,
  GLASS_CARD_CLASS,
  glassCardMesh,
  glassCardSx,
  glassCardPaperProps,
  loginFormContentSx,
  loginFormActionsSx,
  createLoginFormFields,
  createLoginPasswordField,
  createLoginFormActions,
  createLoginActionButtons,
  createLoginPageFormComponent,
  registerLoginPageForm,
  attachDefaultKit,
  attachNeonGlassToISAFront: attachDefaultKit,
  NEON_GLASS_KIT_ID,
  Layout: { ...(typeof window !== "undefined" && window.ISAFront?.Layout ? window.ISAFront.Layout : {}) },
};

if (typeof window !== "undefined" && window.React && window.MaterialUI) {
  registerFeedbackGlobal(window.React, window.MaterialUI);
  registerCodeMirror(window.React, window.MaterialUI);
  registerLoginPageForm();
  attachDefaultKit();
}

window.__isaFrontReady = Promise.resolve(true);
