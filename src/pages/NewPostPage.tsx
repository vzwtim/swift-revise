import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export function NewPostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "エラー",
        description: "タイトルは必須です。",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      toast({
        title: "エラー",
        description: "投稿するにはログインが必要です。",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const postData = {
      title,
      content,
      is_anonymous: isAnonymous,
      user_id: isAnonymous ? null : user.id,
    };

    const { error } = await supabase.from('posts').insert([postData]);

    setLoading(false);

    if (error) {
      console.error('Error creating post:', error);
      toast({
        title: "エラー",
        description: "投稿の作成に失敗しました。",
        variant: "destructive",
      });
    } else {
      toast({
        title: "成功",
        description: "新しい投稿が作成されました。",
      });
      navigate('/forum');
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>新しい投稿を作成</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="質問や情報のタイトル"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">内容</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="詳細な内容を記入してください"
                rows={10}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(Boolean(checked))}
              />
              <Label htmlFor="anonymous" className="cursor-pointer">
                匿名で投稿する
              </Label>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? '投稿中...' : '投稿する'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
