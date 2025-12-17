import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Notificacao = Tables<'notificacoes'>;

export function useNotificacoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notificacoes = [], isLoading, error } = useQuery({
    queryKey: ['notificacoes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notificacao[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notificacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.setQueryData<Notificacao[]>(
            ['notificacoes', user.id],
            (old = []) => [payload.new as Notificacao, ...old]
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.setQueryData<Notificacao[]>(
            ['notificacoes', user.id],
            (old = []) =>
              old.map((n) =>
                n.id === payload.new.id ? (payload.new as Notificacao) : n
              )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const naoLidas = notificacoes.filter((n) => !n.lida);

  const marcarComoLida = useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', notificacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] });
    },
  });

  const marcarTodasComoLidas = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('user_id', user.id)
        .eq('lida', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] });
    },
  });

  return {
    notificacoes,
    naoLidas,
    isLoading,
    error,
    marcarComoLida: marcarComoLida.mutate,
    marcarTodasComoLidas: marcarTodasComoLidas.mutate,
    countNaoLidas: naoLidas.length,
  };
}
