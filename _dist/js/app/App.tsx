/**
 * App.tsx — Componente raíz.
 * Mantiene el estado global del quiz: ruta actual, sesión activa, progreso.
 * No usa librería de router: navega por estado.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Box } from "@mui/material";
// AppShell es cargado por william-front.js / app-shell.jsx y expuesto en window.WilliamFront.Layout.AppShell
declare const AppShell: any;
import { HomeView } from "./views/HomeView.tsx";
import { QuizView } from "./views/QuizView.tsx";
import { ResultsView } from "./views/ResultsView.tsx";
import { loadQuestions, type Question, type QuizSession, type QuizResult } from "./core/quiz.ts";
import { loadStats as _loadStats } from "./core/stats.ts";

const NS = "WILLIAM";

export type Route = "home" | "quiz" | "results";

export type AppState = {
  route: Route;
  questions: Question[];
  loadingQuestions: boolean;
  session: QuizSession | null;
  result: QuizResult | null;
};

export function App() {
  const [state, setState] = useState<AppState>({
    route: "home",
    questions: [],
    loadingQuestions: true,
    session: null,
    result: null,
  });

  // Cargar preguntas al inicio
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
    const newSession = {
      ...state.session,
      startedAt: Date.now(),
    };
    setState((s) => ({ ...s, route: "quiz", session: newSession, result: null }));
  }, [state.session]);

  const navRows = useMemo(
    () => [
      {
        id: "primary",
        tabs: [
          { id: "home", icon: "mdi:home-outline", label: "Inicio" },
          { id: "quiz", icon: "mdi:head-question-outline", label: "Práctica" },
          { id: "results", icon: "mdi:trophy-outline", label: "Resultados", disabled: !state.result },
        ],
        value: state.route,
        onChange: (id: string) => {
          if (id === "results" && !state.result) return;
          if (id === "quiz" && !state.session) return;
          setState((s) => ({ ...s, route: id as Route }));
        },
      },
    ],
    [state.route, state.session, state.result]
  );

  let body;
  if (state.loadingQuestions) {
    body = <CenteredMessage message="Cargando banco de preguntas…" />;
  } else if (state.questions.length === 0) {
    body = (
      <CenteredMessage
        message="No se pudieron cargar las preguntas. Verifica tu conexión o inténtalo más tarde."
        icon="mdi:cloud-alert-outline"
      />
    );
  } else if (state.route === "home") {
    body = <HomeView questions={state.questions} onStart={startQuiz} stats={_loadStats()} />;
  } else if (state.route === "quiz" && state.session) {
    body = (
      <QuizView
        session={state.session}
        questions={state.questions}
        onFinish={finishQuiz}
        onAbort={goHome}
      />
    );
  } else if (state.route === "results" && state.result) {
    body = (
      <ResultsView
        result={state.result}
        questions={state.questions}
        onRetry={retryQuiz}
        onHome={goHome}
      />
    );
  } else {
    body = <CenteredMessage message="Estado inválido. Vuelve al inicio." icon="mdi:alert-circle-outline" />;
  }

  return (
    <AppShell ns={NS} navRows={navRows} brand={{ title: "William Quest", icon: "mdi:shield-lock-outline" }}>
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
      {icon ? (
        <iconify-icon icon={icon} width="3rem" height="3rem" style={{ opacity: 0.65 }} />
      ) : null}
      <Box sx={{ fontSize: "1.05rem", fontWeight: 500, textAlign: "center", maxWidth: 480 }}>{message}</Box>
    </Box>
  );
}

