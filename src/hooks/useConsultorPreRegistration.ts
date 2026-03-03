import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConsultorPreRegistration {
    id: string;
    email: string;
    nome: string | null;
    created_by: string | null;
    created_at: string;
    used_at: string | null;
    used_by_user_id: string | null;
}

// Fetch all consultant pre-registrations
export function useConsultorPreRegistrations() {
    return useQuery({
        queryKey: ["consultor-pre-registrations"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("consultant_pre_registrations")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []) as ConsultorPreRegistration[];
        },
    });
}

// Add a new consultant pre-registration
export function useAddConsultorPreRegistration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ email, nome }: { email: string; nome?: string }) => {
            const { data: userData } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from("consultant_pre_registrations")
                .insert({
                    email: email.toLowerCase().trim(),
                    nome: nome || null,
                    created_by: userData.user?.id,
                })
                .select()
                .single();

            if (error) {
                if (error.code === "23505") {
                    throw new Error("Este email já está cadastrado");
                }
                throw error;
            }
            return data as ConsultorPreRegistration;
        },
        onSuccess: () => {
            toast.success("Email de consultor pré-registrado com sucesso");
            queryClient.invalidateQueries({ queryKey: ["consultor-pre-registrations"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Erro ao pré-registrar consultor");
        },
    });
}

// Remove a consultant pre-registration
export function useRemoveConsultorPreRegistration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("consultant_pre_registrations")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Pré-registro removido com sucesso");
            queryClient.invalidateQueries({ queryKey: ["consultor-pre-registrations"] });
        },
        onError: () => {
            toast.error("Erro ao remover pré-registro");
        },
    });
}
