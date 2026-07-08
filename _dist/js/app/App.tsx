/**
 * App.tsx — Componente raíz.
 */
import { useState, useEffect, useCallback, useMemo, type ComponentType } from "react";
import { Box } from "@mui/material";
import { HomeView } from "./views/HomeView.tsx";
import { QuizView } from "./views/QuizView.tsx";
import { ResultsView } from "./views/ResultsView.tsx";
import { LocaleToolbar, useAppLocale } from "./components/LocaleToolbar.tsx";
import { loadQuestions, type Question, type QuizSession, type QuizResult } from "./core/quiz.ts";
import { loadStats as _loadStats } from "./core/stats.ts";
import { t } from "./core/ui-i18n.ts";

const NS = "WILLIAM";

function resolveAppShell(): ComponentType<any> | null {
  const g = globalThis as typeof globalThis & {
    AppShell?: ComponentType<any>;
    WilliamFront?: { Layout?: { AppShell?: ComponentType<any> } };
  };
  return g.AppShell ?? g.WilliamFront?.Layout?.AppShell ?? null;
}

export type Route = "home" | "quiz" | "results";

export type AppState = {
  route: Route;
  questions: Question[];
  loadingQuestions: boolean;
  session: QuizSession | null;
  result: QuizResult | null;
};

export function App() {
  const { locale } = useAppLocale();
  const [state, setState] = useState<AppState>({
    route: "home",
    questions: [],
    loadingQuestions: true,
    session: null,
    result: null,
  });

  useEffect(() => {
    let alive = true;
    loadQuestions()
      .then((qs) => {
        if (!alive) return;
        setState((s) => ({ ...s, questions: qs, loadingQuestions: false }));
      })
      .catch((err) => {
        console.error("[WilliamQuest] No se pudieron cargar las preguntas:", err);
        if (!alive) return;
        setState((s) => ({ ...s, loadingQuestions: false }));
      });
    return () => {
      alive = false;
    };
  }, []);

  const goHome = useCallback(() => {
    setState((s) => ({ ...s, route: "home", session: null, result: null }));
  }, []);

  const startQuiz = useCallback((session: QuizSession) => {
    setState((s) => ({ ...s, route: "quiz", session, result: null }));
  }, []);

  const finishQuiz = useCallback((result: QuizResult) => {
    setState((s) => ({ ...s, route: "results", result }));
  }, []);

  const retryQuiz = useCallback(() => {
    if (!state.session) return;
    setState((s) => ({
      ...s,
      route: "quiz",
      session: { ...state.session!, startedAt: Date.now() },
      result: null,
    }));
  }, [state.session]);

  const navRows = useMemo(
    () => [
      {
        id: "primary",
        tabs: [
          { id: "home", icon: "mdi:home-outline", label: t("navHome", locale) },
          { id: "quiz", icon: "mdi:head-question-outline", label: t("navQuiz", locale) },
          {
            id: "results",
            icon: "mdi:trophy-outline",
            label: t("navResults", locale),
            disabled: !state.result,
          },
        ],
        value: state.route,
        onChange: (id: string) => {
          if (id === "results" && !state.result) return;
          if (id === "quiz" && !state.session) return;
          setState((s) => ({ ...s, route: id as Route }));
        },
      },
    ],
    [state.route, state.session, state.result, locale]
  );

  let body;
  if (state.loadingQuestions) {
    body = <CenteredMessage message={t("loadingQuestions", locale)} />;
  } else if (state.questions.length === 0) {
    body = <CenteredMessage message={t("loadError", locale)} icon="mdi:cloud-alert-outline" />;
  } else if (state.route === "home") {
    body = <HomeView questions={state.questions} onStart={startQuiz} stats={_loadStats()} />;
  } else if (state.route === "quiz" && state.session) {
    body = (
      <QuizView session={state.session} questions={state.questions} onFinish={finishQuiz} onAbort={goHome} />
    );
  } else if (state.route === "results" && state.result) {
    body = (
      <ResultsView result={state.result} questions={state.questions} onRetry={retryQuiz} onHome={goHome} />
    );
  } else {
    body = <CenteredMessage message={t("invalidState", locale)} icon="mdi:alert-circle-outline" />;
  }

  const AppShell = resolveAppShell();
  if (!AppShell) {
    return (
      <CenteredMessage
        message="AppShell no cargado. Recarga la página o ejecuta npm run build."
        icon="mdi:alert-circle-outline"
      />
    );
  }

  return (
    <AppShell
      ns={NS}
      navRows={navRows}
      brand={{ title: "William Quest", icon: "mdi:shield-lock-outline" }}
      toolbarExtra={<LocaleToolbar />}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {body}
      </Box>
    </AppShell>
  );
}

function CenteredMessage({ message, icon }: { message: string; icon?: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.2,
        p: 4,
        color: "text.secondary",
      }}
    >
      {icon ? <iconify-icon icon={icon} width="3rem" height="3rem" style={{ opacity: 0.65 }} /> : null}
      <Box sx={{ fontSize: "1.05rem", fontWeight: 500, textAlign: "center", maxWidth: 480 }}>{message}</Box>
    </Box>
  );
}
