import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  to?: string;
  label?: string;
  variant?: "ghost" | "outline";
}

export function BackButton({ to = "/meu-projeto", label = "Voltar", variant = "ghost" }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <Button variant={variant} onClick={() => navigate(to)} className="mb-4 -ml-2">
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}
