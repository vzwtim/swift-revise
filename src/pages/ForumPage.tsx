import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfileCard } from '@/components/user-profile-card';

// Postの型定義。profilesテーブルの型も含む
export type PostWithProfile = {
  id: string;
  created_at: string;
  title: string;
  is_anonymous: boolean;
  profiles: {
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    department: string | null;
    acquired_qualifications: string[] | null;
    studying_categories: string[] | null; // 追加
  } | null;
};

export function ForumPage() {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          created_at,
          title,
          is_anonymous,
          profiles (
            username,
            avatar_url,
            bio,
            department,
            acquired_qualifications,
            studying_categories
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data as PostWithProfile[]);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const renderPostList = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive">投稿の読み込みに失敗しました。</p>;
    }

    if (posts.length === 0) {
      return <p className="text-muted-foreground">まだ投稿はありません。</p>;
    }

    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <Link to={`/posts/${post.id}`} key={post.id} className="block">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <UserProfileCard
                  profile={post.profiles ? {
                    ...post.profiles,
                    studying_qualifications: post.profiles.studying_categories,
                  } : null}
                >
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarImage src={!post.is_anonymous ? post.profiles?.avatar_url ?? undefined : undefined} />
                    <AvatarFallback>
                      {!post.is_anonymous ? post.profiles?.username?.charAt(0) : '?'}
                    </AvatarFallback>
                  </Avatar>
                </UserProfileCard>
                <div className="flex-1">
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    <span>{!post.is_anonymous ? post.profiles?.username : '匿名さん'}</span>
                    <span className="mx-2">·</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">掲示板</h1>
        <Button asChild>
          <Link to="/forum/new">新しい投稿を作成</Link>
        </Button>
      </div>
      {renderPostList()}
    </div>
  );
}
