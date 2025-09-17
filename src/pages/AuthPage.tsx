import { supabase } from '@/integrations/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // ログインしたらホームページにリダイレクト
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-learning">
      <div className="w-full max-w-md p-8 space-y-8 bg-background/80 backdrop-blur-sm rounded-xl border card-elevated">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-foreground">
            ログイン / 新規登録
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Googleアカウントで続ける
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          showLinks={false}
          localization={{
            variables: {
              sign_in: {
                social_provider_text: '{{provider}}でログイン',
              },
              sign_up: {
                social_provider_text: '{{provider}}で登録',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default AuthPage;
