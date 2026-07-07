/** Tipos ambientales — fronts Jeff-Aporta (Babel runtime, sin node_modules). */

type ReactNode = unknown;
type ReactElement = unknown;
type FC<P = Record<string, unknown>> = (props: P) => ReactNode;

interface ReactHooks {
  useState<S>(initial: S | (() => S)): [S, (v: S | ((prev: S) => S)) => void];
  useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  useLayoutEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  useCallback<T extends (...args: any[]) => any>(fn: T, deps: unknown[]): T;
  useMemo<T>(factory: () => T, deps: unknown[]): T;
  useRef<T>(initial: T | null): { current: T | null };
  Fragment: unique symbol;
  createElement<P>(type: FC<P>, props?: P, ...children: ReactNode[]): ReactElement;
  createElement(type: unknown, props?: Record<string, unknown> | null, ...children: ReactNode[]): ReactElement;
}

interface ReactDOMRoot {
  render(node: ReactNode): void;
}

interface ReactDOMApi {
  createRoot(container: Element | DocumentFragment): ReactDOMRoot;
}

interface BabelApi {
  transform(code: string, opts: { presets: string[]; filename?: string } | unknown): { code: string };
}

interface IsaAuth {
  isLoggedIn(): boolean;
  username(): string | null;
  authHeader(): Record<string, string>;
  login?(user: string, pass: string): Promise<unknown>;
  logout(): void;
  EVENT: string;
  LOGIN_URL?: string;
  AUTH_ONLINE?: string;
}

interface IsaSession {
  current(): { username: string; displayName?: string | null; role: string | null; token: string; expiresAt: string | null } | null;
  isLoggedIn(): boolean;
  username(): string | null;
  displayName?(): string | null;
  authHeader(): Record<string, string>;
  login(user: string, pass: string): Promise<unknown>;
  logout(): void;
  EVENT: string;
}

interface IsaUi {
  Icon: FC<{ icon: string; size?: number }>;
  TargetSwitch: FC<Record<string, never>>;
  TargetSwitchMenu: FC<Record<string, never>>;
  ThemeSwitch: FC<{ mode: string; onToggle: () => void }>;
  LoginGate: FC<{ children?: ReactNode }>;
  LoginGateRedirect?: FC<{ children?: ReactNode }>;
  humanSize?(n: number): string;
  Loading?: FC<{ label?: string }>;
  ErrorBox?: FC<{ message: string }>;
}

interface IsaTheme {
  useThemeMode(): { mode: string; theme: unknown; toggle: () => void };
}

interface IsaConfig {
  apiUrl(path: string): string;
  base?(): string;
}

interface NavTabDef {
  id: string;
  label?: string;
  title?: string;
  icon: string;
}

interface NavRowProps {
  id?: string;
  ns?: string;
  value: string;
  onChange: (id: string) => void;
  tabs: NavTabDef[];
  /** Ctrl/Cmd+clic o clic medio: abre esta URL en pestaña nueva sin cambiar la vista actual. */
  tabHref?: (tabId: string) => string;
  /** primary = toolbar (nav principal); secondary = fila compacta bajo AppBar. */
  tier?: "primary" | "secondary";
  /** Alias de tier secondary — tabs más bajos (26px, ~60% MUI default). */
  compact?: boolean;
  iconSize?: number;
  minHeight?: number;
  sx?: Record<string, unknown>;
  variant?: string;
}

interface AppShellProps {
  ns: string;
  title?: string;
  children?: ReactNode;
  icon?: string;
  iconSize?: number;
  showTitle?: boolean;
  /** false desactiva clic en marca → inicio */
  onBrandClick?: (() => void) | false;
  brandClick?: false;
  navRows?: NavRowProps[];
  toolbarExtra?: ReactNode;
  toolbarActions?: ReactNode;
  toolbarEnd?: ReactNode;
  /** Fila compacta bajo nav secundaria (p. ej. exports IS-Swagger). */
  headerSub?: ReactNode;
  showTarget?: boolean;
  showTheme?: boolean;
  showAuthChip?: boolean;
  showLogout?: boolean;
  loginGate?: boolean;
  bodyScroll?: boolean;
  /** Sin AppBar ni navegación (p. ej. tablero SCRUM público). */
  chromeless?: boolean;
}

interface ViewFrameProps {
  ns?: string;
  navRow?: NavRowProps;
  scroll?: boolean;
  bodySx?: Record<string, unknown>;
  children?: ReactNode;
}

interface IsaFrontApi {
  CDN_BASE: string;
  uiBase: string;
  cssUrl: string;
  MAIN_ORCHESTRATOR_URL_PROD: string;
  MAIN_ORCHESTRATOR_URL_LOCAL: string;
  GATEWAY_URL_PROD: string;
  GATEWAY_URL_LOCAL: string;
  rewriteViaGateway(url: string, gatewayBase: string): string;
  rewriteFlsItem(item: FlsFileItem, gatewayBase: string): FlsFileItem;
  registerApp(opts: Record<string, unknown>): void;
  REALTIME: { CHECKS_UPDATED: string };
  REALTIME_EVENT: string;
  wsUrlFromHttpBase(httpBase: string): string;
  formatLocalDate?(value: unknown): string;
  formatLocalDateTime?(value: unknown): string;
  stripContapymeEmail?(value: unknown): string;
  formatSessionDisplayName?(value: unknown): string;
  formatSessionChipLabel?(value: unknown, fallback?: string): string;
  resolveSessionHeaderLabel?(displayName: unknown, username: unknown, fallback?: string): string;
  estimatePromptTokens?(text: unknown): number;
  ensureLazyStylesheet?(href: string): Promise<void>;
  loadLazyScript?(src: string): Promise<void>;
  loadLazyScriptsSequential?(urls: string[]): Promise<void>;
  ensureCodeMirrorLoaded?(opts?: { sql?: boolean }): Promise<void>;
  ensureCodeMirrorStyles?: () => Promise<void[]>;
  ensureMarked?: () => Promise<void>;
  mdToHtml?(src: string): string;
  showToast(opts: { message: string; severity?: string; durationMs?: number }): void;
  Layout: {
    AppShell: FC<AppShellProps>;
    NavTabRow: FC<NavRowProps>;
    NavTabLabel: FC<{ ns?: string; UI?: IsaUi; icon: string; label: string }>;
    ViewFrame: FC<ViewFrameProps>;
    goBrandHome: () => void;
  };
  Caesar?: { wrapPassword(plain: string): string };
}

interface IsaRealtime {
  start(): void;
  disconnect(): void;
  ping(): void;
  getStatus(): string;
}

interface IsaToast {
  show(opts: { message: string; severity?: string; durationMs?: number }): void;
}

type RealtimeStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

interface ChecksUpdatedMessage {
  type: "checks.updated";
  project: string;
  revisadoKey: string;
  checked: boolean;
  at: number;
}

interface AppNamespace {
  Auth?: IsaAuth;
  Session?: IsaSession;
  Realtime?: IsaRealtime;
  Toast?: IsaToast;
  UI: IsaUi;
  Theme: IsaTheme;
  Config?: IsaConfig;
  mount?: () => void;
  [key: string]: unknown;
}

interface FlsFileItem {
  id: string;
  kind: "image" | "file";
  url: string;
  filename: string;
  ext?: string;
  size: number;
  width?: number;
  height?: number;
  mime?: string;
}

interface FlsApi {
  uploadImage(f: File, title?: string): Promise<FlsFileItem>;
  uploadFile(f: File, title?: string): Promise<FlsFileItem>;
  list(kind?: "image" | "file", limit?: number): Promise<FlsFileItem[]>;
}

interface FlsNs extends AppNamespace {
  Api: FlsApi;
  Config: IsaConfig;
}

interface IatApi {
  status(cap?: string): Promise<{ slots?: unknown[] }>;
  rotationLog(n?: number): Promise<{ rows?: unknown[] }>;
  credentials(): Promise<{ credentials?: unknown[] }>;
  syncKeys(cap?: string): Promise<unknown>;
  models?(): Promise<unknown>;
}

interface IatNs extends AppNamespace {
  Api: IatApi;
  Auth: IsaAuth;
}

interface MoRouteRow {
  service: string;
  base: string;
  prefixes: string[];
  stripApi?: boolean;
}

interface MoCatalogEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  frontUrl?: string;
  swaggerUrl: string;
  docUrl: string;
  apiBase: string;
  orchestratorPrefixes?: string[];
  infra?: boolean;
  orchestratorSwagger?: string;
}

interface MoCatalogResponse {
  ok: boolean;
  orchestratorBase: string;
  note: string;
  apps: MoCatalogEntry[];
}

interface MoApi {
  health(): Promise<{ ok: boolean; service: string; role: string }>;
  routes(): Promise<{ ok: boolean; routes: MoRouteRow[] }>;
  catalog(): Promise<MoCatalogResponse>;
}

interface MoNs extends AppNamespace {
  Api: MoApi;
  Auth: IsaAuth;
  Config: IsaConfig;
}

interface ConvApi {
  list(itercero?: string, icontacto?: string): Promise<{ rows?: unknown[] }>;
  get(id: number): Promise<{ conversacion: Record<string, unknown>; turnos?: unknown[] }>;
  create?(): Promise<unknown>;
  instrucciones?(): Promise<unknown>;
  tipos?(): Promise<unknown>;
}

interface ConvNs extends AppNamespace {
  Api: ConvApi;
  Auth: IsaAuth;
}

interface SlgApi {
  fetchSession(): Promise<Record<string, unknown>>;
}

interface SlgNs extends AppNamespace {
  Api: SlgApi;
  Session: IsaSession;
  Config: IsaConfig;
}

interface ViewProps {
  project: string;
  reloadKey?: number;
}

type IsaStateValue = string | number | boolean | Record<string, unknown>;

interface UrlStateApi {
  boot: Record<string, IsaStateValue>;
  merge(params: Record<string, IsaStateValue>): void;
  subscribe(fn: (s: Record<string, IsaStateValue>) => void): () => void;
  get?(): Record<string, IsaStateValue>;
  MAX_VALUE?: number;
}

interface IsajApi {
  labFetch?<T>(path: string, opts?: { method?: string; headers?: Record<string, string>; body?: unknown }): Promise<T>;
  ping?(): Promise<unknown>;
  getSpaces?(): Promise<unknown>;
  getBitacora(project: string): Promise<unknown>;
  getTickets(project: string, opts?: { estado?: string }): Promise<unknown>;
  getTicket(project: string, iticket: string | number): Promise<unknown>;
  getChecks(project: string): Promise<unknown>;
  setCheck(project: string, key: string, checked: boolean): Promise<unknown>;
  getRevisadoMap?(project: string, force?: boolean): Promise<Record<string, boolean>>;
  invalidateRevisadoCache?(project?: string): void;
  execSql?(project: string, payload: { sql: string; dbTarget?: string; segmentId?: string }): Promise<unknown>;
}

interface IsajNs extends AppNamespace {
  UrlState: UrlStateApi;
  BitacoraView: FC<ViewProps>;
  TicketsView: FC<ViewProps>;
  ChecksView: FC<ViewProps>;
  LoginButton: FC<Record<string, never>>;
  Api: IsajApi;
  Session: IsaSession;
  Config: IsaConfig;
  Realtime?: IsaRealtime;
  Toast?: IsaToast;
  useRealtimeNotifications?: (opts: {
    project: string;
    onChecksUpdated?: (msg: ChecksUpdatedMessage) => void;
  }) => RealtimeStatus;
  Storage?: {
    local: { get<T>(key: string): T | null; set(key: string, value: unknown): boolean; del(key: string): void };
    big: { get<T>(key: string): Promise<T | null>; set(key: string, value: unknown): Promise<boolean>; del(key: string): Promise<boolean> };
  };
}

declare const React: ReactHooks;
declare const ReactDOM: ReactDOMApi;
declare const MaterialUI: Record<string, unknown>;
declare const Babel: BabelApi;

interface Window {
  ISAFront: IsaFrontApi;
  FLS: FlsNs;
  IAT: IatNs;
  MO: MoNs;
  CONV: ConvNs;
  SLG: SlgNs;
  ISAJ: IsajNs;
  marked?: { parse(src: string): string };
}
