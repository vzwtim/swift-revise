import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { PostWithProfile } from './ForumPage'; // 型を再利用

// コメント用の型定義
type CommentWithProfile = {
  id: string;
  created_at: string;
  content: string | null;
  is_anonymous: boolean;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
};

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<PostWithProfile | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [isCommentAnonymous, setIsCommentAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPostAndComments = async () => {
    if (!postId) return;

    // setLoading(true); // 2回目以降のフェッチではローディングを出さない
    setError(null);

    try {
      const postPromise = supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('id', postId)
        .single();

      const commentsPromise = supabase
        .from('comments')
        .select('*, profiles(username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      const [{ data: postData, error: postError }, { data: commentsData, error: commentsError }] = await Promise.all([postPromise, commentsPromise]);

      if (postError) throw postError;
      if (commentsError) throw commentsError;

      setPost(postData as PostWithProfile);
      setComments(commentsData as CommentWithProfile[]);

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostAndComments();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !postId) {
      toast({ title: "エラー", description: "コメントを投稿できません。", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('comments').insert([{
      post_id: postId,
      content: newComment,
      is_anonymous: isCommentAnonymous,
      user_id: isCommentAnonymous ? null : user.id,
    }]);

    if (error) {
      toast({ title: "エラー", description: "コメントの投稿に失敗しました。", variant: "destructive" });
    } else {
      setNewComment('');
      setIsCommentAnonymous(false);
      toast({ title: "成功", description: "コメントを投稿しました。" });
      fetchPostAndComments(); // コメントリストを再取得して更新
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-3xl space-y-8">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <div className="border-t pt-8">
          <Skeleton className="h-8 w-1/4 mb-4" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return <div className="container mx-auto py-8 text-destructive">投稿の読み込みに失敗しました。</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={!post.is_anonymous ? post.profiles?.avatar_url ?? undefined : undefined} />
            <AvatarFallback className="text-xl">
              {!post.is_anonymous ? post.profiles?.username?.charAt(0) : '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{post.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              <span>{!post.is_anonymous ? post.profiles?.username : '匿名さん'}</span>
              <span className="mx-2">·</span>
              <span>{new Date(post.created_at).toLocaleString()}</span>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{post.content ?? ''}</p>
        </CardContent>
      </Card>

      {user && (
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-lg font-semibold">コメントを投稿する</h3>
          </CardHeader>
          <form onSubmit={handleCommentSubmit}>
            <CardContent className="space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを入力..."
                rows={4}
                required
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="comment-anonymous"
                  checked={isCommentAnonymous}
                  onCheckedChange={(checked) => setIsCommentAnonymous(Boolean(checked))}
                />
                <Label htmlFor="comment-anonymous" className="cursor-pointer">匿名でコメントする</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '投稿中...' : 'コメントする'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="space-y-6">
        <h3 className="text-xl font-semibold border-b pb-2">コメント ({comments.length})</h3>
        {comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={!comment.is_anonymous ? comment.profiles?.avatar_url ?? undefined : undefined} />
                <AvatarFallback>
                  {!comment.is_anonymous ? comment.profiles?.username?.charAt(0) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted/50 rounded-lg p-4">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold">{!comment.is_anonymous ? comment.profiles?.username : '匿名さん'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</p>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground py-4">まだコメントはありません。</p>
        )}
      </div>
    </div>
  );
}
