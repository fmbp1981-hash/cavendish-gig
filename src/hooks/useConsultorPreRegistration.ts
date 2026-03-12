import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserPreRegistration {
    id: string;
    email: string;
    nome: string | null;
    role: string;
    created_by: string | null;
    created_at: string;
    used_at: string | null;
    used_by_user_id: string | null;
}

// Fetch all user pre-registrations
export function useUserPreRegistrations() {
    return useQuery({
        queryKey: ["user-pre-registrations"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("user_pre_registrations")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []) as UserPreRegistration[];
        },
    });
}

// Add a new user pre-registration
export function useAddUserPreRegistration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ email, nome, role = 'consultor' }: { email: string; nome?: string; role?: string }) => {
            const { data: userData } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from("user_pre_registrations")
                .insert({
                    email: email.toLowerCase().trim(),
                    nome: nome || null,
                    role: role,
                    created_by: userData.user?.id,
                })
                .select()
                .single();

            if (error) {
                if (error.code === "23505") {
                    throw new Error("Este email já possui um pré-registro");
                }
                throw error;
            }
            return data as UserPreRegistration;
        },
        onSuccess: () => {
            toast.success("Usuário pré-registrado com sucesso");
            queryClient.invalidateQueries({ queryKey: ["user-pre-registrations"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Erro ao pré-registrar usuário");
        },
    });
}

// Remove a user pre-registration
export function useRemoveUserPreRegistration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("user_pre_registrations")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Pré-registro removido com sucesso");
            queryClient.invalidateQueries({ queryKey: ["user-pre-registrations"] });
        },
        onError: () => {
            toast.error("Erro ao remover pré-registro");
        },
    });
}
