import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

// プロフィール情報の型を定義
export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  department: string | null;
  acquired_qualifications: string[] | null;
  updated_at: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null; // profile を追加
  loading: boolean;
  refreshUserProfile: () => Promise<void>; // 更新関数を追加
  displayName: string; // 表示名を追加
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshUserProfile: async () => {},
  displayName: '名無しさん', // デフォルト値
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // プロフィールを取得する関数
  const fetchUserProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116は行が見つからないエラー
        throw error;
      }
      setProfile(data as Profile | null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  }, []);

  // プロフィールをリフレッシュする関数
  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

  useEffect(() => {
    const setupAuth = async () => {
      setLoading(true);
      // 初回読み込み時にセッションとプロフィールを取得
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await fetchUserProfile(currentUser);
      setLoading(false);

      // 認証状態の変更を監視
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        const newCurrentUser = session?.user ?? null;
        setUser(newCurrentUser);
        // ユーザーが変わったらプロフィールも更新
        if (newCurrentUser?.id !== user?.id) {
          await fetchUserProfile(newCurrentUser);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    setupAuth();
  }, [user?.id, fetchUserProfile]);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    refreshUserProfile,
    displayName: profile?.username || user?.user_metadata?.name || '名無しさん',
  }), [session, user, profile, loading, refreshUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
