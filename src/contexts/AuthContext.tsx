import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { Card } from '@/lib/types';
import { loadAllCards, saveCards } from '@/lib/card-storage';
import { initializeCards } from '@/lib/quiz-builder';

// Add a Profile type
export interface Profile {
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  department: string | null;
  acquired_qualifications: string[] | null;
  studying_categories: string[] | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  cards: { [questionId: string]: Card };
  isCardsLoading: boolean;
  updateStudyingCategories: (newCategories: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  cards: {},
  isCardsLoading: true,
  updateStudyingCategories: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<{ [questionId: string]: Card }>({});
  const [isCardsInitialized, setIsCardsInitialized] = useState(false);
  const [isCardsLoading, setIsCardsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (user: User) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !isCardsInitialized) {
      const initializeUserCards = async () => {
        setIsCardsLoading(true);
        console.log("[AuthContext] Initializing cards for new user...");

        const allCards = await loadAllCards();
        const { currentCardsMap, newCardsToSave } = await initializeCards(allCards);

        if (newCardsToSave.length > 0) {
          console.log(`[AuthContext] Found ${newCardsToSave.length} new cards. Saving to DB...`);
          await saveCards(newCardsToSave);
        }

        setCards(currentCardsMap);
        setIsCardsInitialized(true);
        setIsCardsLoading(false);
        console.log("[AuthContext] Card initialization complete.");
      };

      initializeUserCards();
    } else if (!user) {
      // User logged out, reset card state
      setCards({});
      setIsCardsInitialized(false);
      setIsCardsLoading(false); // Set to false as there's nothing to load
    }
  }, [user, isCardsInitialized]);


  const updateStudyingCategories = async (newCategories: string[]) => {
    if (!user) {
      console.error("Cannot update categories without a user.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ studying_categories: newCategories })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error updating studying categories:", error);
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    cards,
    isCardsLoading,
    updateStudyingCategories,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};