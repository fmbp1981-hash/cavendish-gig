import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector
  placement?: "top" | "bottom" | "left" | "right" | "center";
  action?: () => void;
  skipable?: boolean;
}

export interface TutorialProgress {
  id: string;
  user_id: string;
  tutorial_type: string;
  current_step: number;
  completed_steps: string[];
  is_completed: boolean;
  last_seen_at: string;
}

export function useTutorial(tutorialType: string) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const queryClient = useQueryClient();

  const sb = supabase as any;

  const { data: progress, isLoading } = useQuery({
    queryKey: ["tutorial-progress", tutorialType],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await sb
        .from("tutorial_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("tutorial_type", tutorialType)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data as TutorialProgress | null;
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({
      step,
      completed,
    }: {
      step: number;
      completed?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const completedSteps = progress?.completed_steps || [];
      if (completed && !completedSteps.includes(step.toString())) {
        completedSteps.push(step.toString());
      }

      const { data, error } = await sb
        .from("tutorial_progress")
        .upsert({
          user_id: user.id,
          tutorial_type: tutorialType,
          current_step: step,
          completed_steps: completedSteps,
          is_completed: completed || false,
          last_seen_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,tutorial_type",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-progress", tutorialType] });
    },
  });

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStepIndex(progress?.current_step || 0);
  };

  const stopTutorial = () => {
    setIsActive(false);
  };

  const nextStep = async (steps: TutorialStep[]) => {
    const newIndex = currentStepIndex + 1;

    if (newIndex >= steps.length) {
      // Tutorial completed
      await updateProgress.mutateAsync({
        step: steps.length - 1,
        completed: true,
      });
      setIsActive(false);
      return;
    }

    await updateProgress.mutateAsync({
      step: newIndex,
      completed: false,
    });

    setCurrentStepIndex(newIndex);
  };

  const previousStep = async () => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      await updateProgress.mutateAsync({
        step: newIndex,
        completed: false,
      });
      setCurrentStepIndex(newIndex);
    }
  };

  const skipTutorial = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await sb
      .from("tutorial_progress")
      .upsert({
        user_id: user.id,
        tutorial_type: tutorialType,
        current_step: -1,
        is_completed: true,
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,tutorial_type",
      });

    setIsActive(false);
  };

  const resetTutorial = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await sb
      .from("tutorial_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("tutorial_type", tutorialType);

    setCurrentStepIndex(0);
    queryClient.invalidateQueries({ queryKey: ["tutorial-progress", tutorialType] });
  };

  return {
    isActive,
    currentStepIndex,
    progress,
    isLoading,
    startTutorial,
    stopTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    resetTutorial,
    isCompleted: progress?.is_completed || false,
  };
}
