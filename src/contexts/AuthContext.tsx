import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, AppRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  /** true somente após fetchUserData completar (com sucesso ou erro). Garante que roles estão carregados. */
  rolesReady: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: { nome?: string; empresa?: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  isConsultor: boolean;
  isCliente: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesReady, setRolesReady] = useState(false);

  // Guard against concurrent double calls on initialization
  const fetchingUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Reset rolesReady on new sign-in so redirect waits for roles
        if (event === 'SIGNED_IN') {
          setRolesReady(false);
          setLoading(true);
        }
        // Defer Supabase calls with setTimeout to prevent deadlock
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      } else {
        fetchingUserIdRef.current = null;
        setProfile(null);
        setRoles([]);
        setRolesReady(false);
        setLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    // Fix 3: skip if already fetching for this user
    if (fetchingUserIdRef.current === userId) return;
    fetchingUserIdRef.current = userId;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[AuthContext] Profile fetch error:', profileError.message);
      }

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('[AuthContext] Roles fetch error:', rolesError.message);
      }

      if (rolesData && Array.isArray(rolesData)) {
        const mappedRoles = rolesData.map((r: { role: string }) => r.role as AppRole);
        setRoles(mappedRoles);
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching user data:', error instanceof Error ? error.message : error);
    } finally {
      fetchingUserIdRef.current = null;
      setLoading(false);
      setRolesReady(true); // sempre sinaliza que tentou carregar (mesmo em erro de rede)
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  // Fix 2: accept and pass empresa metadata
  const signUp = async (email: string, password: string, metadata?: { nome?: string; empresa?: string }) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  const value: AuthContextType = {
    user,
    session,
    profile,
    roles,
    loading,
    rolesReady,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    hasRole,
    isAdmin: hasRole('admin'),
    isConsultor: hasRole('consultor') || hasRole('admin'),
    isCliente: hasRole('cliente'),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
