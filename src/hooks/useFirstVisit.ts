import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useFirstVisit() {
  const { user, isAdmin, isConsultor, isCliente } = useAuth();
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsChecking(false);
      return;
    }

    const storageKey = `first-visit-${user.id}`;
    const hasVisited = localStorage.getItem(storageKey);

    if (!hasVisited) {
      setIsFirstVisit(true);
      localStorage.setItem(storageKey, "true");
    }

    setIsChecking(false);
  }, [user]);

  const markAsVisited = () => {
    if (user) {
      const storageKey = `first-visit-${user.id}`;
      localStorage.setItem(storageKey, "true");
      setIsFirstVisit(false);
    }
  };

  const getUserRole = () => {
    if (isAdmin || isConsultor) return "consultor";
    if (isCliente) return "cliente";
    return null;
  };

  return {
    isFirstVisit,
    isChecking,
    markAsVisited,
    userRole: getUserRole(),
  };
}
