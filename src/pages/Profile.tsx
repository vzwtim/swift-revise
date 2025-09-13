import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getRankStyle } from '@/lib/utils';

export default function Profile() {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [stats, setStats] = useState<{ total_answers: number; correct_answers: number } | null>(null);

  useEffect(() => {
    if (user) {
      getProfile();
      getUserStats();
    }
  }, [user]);

  async function getUserStats() {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('get_user_stats', { p_user_id: user.id }).single();
      if (error) throw error;
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }

  async function getProfile() {
    try {
      setLoading(true);
      if (!user) throw new Error('No user');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, avatar_url, bio, department, acquired_qualifications`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || '');
        setBio(data.bio || '');
        setDepartment(data.department || '');
        setQualifications((data.acquired_qualifications || []).join(', '));
      }
    } catch (error) {
      alert('Error loading user data!');
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      if (!user) throw new Error('No user');

      const qualificationsArray = qualifications.split(',').map(q => q.trim()).filter(q => q);

      const updates = {
        id: user.id,
        username: username || null,
        avatar_url: avatarUrl || null,
        bio: bio || null,
        department: department || null,
        acquired_qualifications: qualificationsArray.length > 0 ? qualificationsArray : null,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      
      // プロフィール更新後に全体の状態をリフレッシュ
      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      alert('Profile updated!');
    } catch (error) {
      alert('Error updating the data!');
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!user) throw new Error('No user');

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // publicUrlを取得して、すぐにUIに反映させる
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);

      // 同時にprofilesテーブルも更新する
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date() }).eq('id', user.id);
      if (updateError) throw updateError;

      // 全体の状態をリフレッシュ
      if (refreshUserProfile) {
        await refreshUserProfile();
      }

    } catch (error) {
      alert('Error uploading avatar!');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-learning">
       <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
            <div>
              <h1 className="text-lg font-semibold">プロフィール編集</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto card-elevated">
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
            <CardDescription>ユーザー名とアバター画像を更新できます。</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className={cn("h-24 w-24", getRankStyle(stats?.total_answers))}>
                    <AvatarImage src={avatarUrl} alt="Avatar" />
                    <AvatarFallback>{username?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar" className="sr-only">アバター画像</Label>
                    <Input id="avatar" type="file" onChange={uploadAvatar} disabled={uploading} />
                    {uploading && <p className="text-sm text-muted-foreground mt-2">アップロード中...</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-around text-center p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-2xl font-bold">{stats ? stats.total_answers : '-'}</p>
                      <p className="text-sm text-muted-foreground">総回答数</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats ? stats.correct_answers : '-'}</p>
                      <p className="text-sm text-muted-foreground">総正解数</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {stats && stats.total_answers > 0 ? Math.round((stats.correct_answers / stats.total_answers) * 100) : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">正解率</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="username">ユーザー名</Label>
                <Input id="username" type="text" value={username || ''} onChange={(e) => setUsername(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="bio">自己紹介</Label>
                <Textarea id="bio" value={bio || ''} onChange={(e) => setBio(e.target.value)} placeholder="あなたの経歴や学習目標など" />
              </div>

              <div>
                <Label htmlFor="department">所属</Label>
                <Input id="department" type="text" value={department || ''} onChange={(e) => setDepartment(e.target.value)} placeholder="会社名、部署名など" />
              </div>

              <div>
                <Label htmlFor="qualifications">取得済み資格</Label>
                <Input id="qualifications" type="text" value={qualifications || ''} onChange={(e) => setQualifications(e.target.value)} placeholder="資格名をカンマ区切りで入力" />
              </div>

              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
              </div>

              <div>
                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? '保存中...' : 'プロフィールを更新'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
