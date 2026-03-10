"use client";
/**
 * TourContext — Sistema de tour interativo com driver.js
 * Suporta navegação cross-page via sessionStorage.
 */
import "driver.js/dist/driver.css";
import { driver } from "driver.js";
import type { DriveStep } from "driver.js";
import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getTourByKey, TourDefinition } from "@/config/tourDefinitions";

/* ─── Session storage ────────────────────────────────────────────────────── */
const SESSION_KEY = "gig_tour_session";

interface TourSession {
  tourKey: string;
  stepIndex: number;
  expectedPage: string;
}

function saveTourSession(s: TourSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}
function clearTourSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
function getTourSession(): TourSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as TourSession) : null;
  } catch {
    return null;
  }
}

/* ─── Context ────────────────────────────────────────────────────────────── */
interface TourContextType {
  startTour: (tourKey: string) => void;
}

const TourContext = createContext<TourContextType>({ startTour: () => {} });

export function useTour() {
  return useContext(TourContext);
}

/* ─── Provider ───────────────────────────────────────────────────────────── */
export function TourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const driverRef = useRef<any>(null);
  const activeTourRef = useRef<TourDefinition | null>(null);
  // Flag para evitar que onDestroyStarted limpe sessão de navegação cross-page
  const isNavigatingRef = useRef(false);

  /** Constrói os DriveSteps para driver.js a partir da TourDefinition */
  const buildDriverSteps = (tour: TourDefinition): DriveStep[] =>
    tour.steps.map((step) => ({
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side ?? "bottom",
        align: "start" as const,
      },
    }));

  /** Inicializa driver.js e começa o tour a partir de startIndex */
  const launchDriver = useCallback(
    (tour: TourDefinition, startIndex: number) => {
      driverRef.current?.destroy();
      activeTourRef.current = tour;

      const steps = buildDriverSteps(tour);

      const d = driver({
        showProgress: true,
        progressText: "{{current}} de {{total}}",
        nextBtnText: "Próximo →",
        prevBtnText: "← Anterior",
        doneBtnText: "✓ Concluir",
        popoverClass: "gig-tour-popover",
        allowClose: true,
        steps,

        onNextClick: () => {
          const currentIndex = d.getActiveIndex() ?? 0;
          const nextIndex = currentIndex + 1;

          if (nextIndex >= tour.steps.length) {
            clearTourSession();
            d.destroy();
            return;
          }

          const nextStep = tour.steps[nextIndex];
          if (nextStep.page && nextStep.page !== window.location.pathname) {
            // Salva sessão ANTES de destruir; isNavigatingRef protege onDestroyStarted
            isNavigatingRef.current = true;
            saveTourSession({
              tourKey: tour.key,
              stepIndex: nextIndex,
              expectedPage: nextStep.page,
            });
            d.destroy();
            isNavigatingRef.current = false;
            navigate(nextStep.page);
          } else {
            d.moveNext();
          }
        },

        onPrevClick: () => {
          const currentIndex = d.getActiveIndex() ?? 0;
          const prevIndex = currentIndex - 1;

          if (prevIndex < 0) {
            clearTourSession();
            d.destroy();
            return;
          }

          const prevStep = tour.steps[prevIndex];
          if (prevStep.page && prevStep.page !== window.location.pathname) {
            isNavigatingRef.current = true;
            saveTourSession({
              tourKey: tour.key,
              stepIndex: prevIndex,
              expectedPage: prevStep.page,
            });
            d.destroy();
            isNavigatingRef.current = false;
            navigate(prevStep.page);
          } else {
            d.movePrevious();
          }
        },

        // Chamado pelo botão X do popover (driver.js v1.x não destrói automaticamente)
        onCloseClick: () => {
          clearTourSession();
          activeTourRef.current = null;
          d.destroy();
        },

        onDestroyStarted: () => {
          // Não limpa sessão durante navegação cross-page (sessão acabou de ser salva)
          if (!isNavigatingRef.current) {
            clearTourSession();
          }
          activeTourRef.current = null;
        },
      });

      driverRef.current = d;
      d.drive(startIndex);
    },
    [navigate]
  );

  /** Ao mudar de página, verifica se há um tour pendente de retomar */
  useEffect(() => {
    const session = getTourSession();
    if (!session) return;
    if (session.expectedPage !== location.pathname) return;

    clearTourSession();
    const tour = getTourByKey(session.tourKey);
    if (!tour) return;

    // Aguarda o DOM renderizar antes de iniciar o driver
    const timer = setTimeout(() => {
      launchDriver(tour, session.stepIndex);
    }, 700);

    return () => clearTimeout(timer);
  }, [location.pathname, launchDriver]);

  /** Cleanup ao desmontar */
  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  /** Ponto de entrada público — inicia um tour pelo key */
  const startTour = useCallback(
    (tourKey: string) => {
      clearTourSession();
      const tour = getTourByKey(tourKey);
      if (!tour) return;

      const firstStep = tour.steps[0];
      if (firstStep.page && firstStep.page !== window.location.pathname) {
        saveTourSession({
          tourKey: tour.key,
          stepIndex: 0,
          expectedPage: firstStep.page,
        });
        navigate(firstStep.page);
      } else {
        launchDriver(tour, 0);
      }
    },
    [navigate, launchDriver]
  );

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
    </TourContext.Provider>
  );
}
