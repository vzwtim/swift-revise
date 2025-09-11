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
            アカウントを作成
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            またはログインして学習を始めよう
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          localization={{
            variables: {
              sign_in: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                button_label: 'ログイン',
                social_provider_text: '{{provider}}でログイン',
                link_text: 'すでにアカウントをお持ちですか？ログイン',
              },
              sign_up: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                button_label: '登録する',
                social_provider_text: '{{provider}}で登録',
                link_text: 'アカウントをお持ちではありませんか？登録',
              },
              forgotten_password: {
                email_label: 'メールアドレス',
                button_label: 'パスワードをリセット',
                link_text: 'パスワードをお忘れですか？',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default AuthPage;
