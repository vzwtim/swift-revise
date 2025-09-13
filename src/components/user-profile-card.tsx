import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building, Award, User, BarChart } from "lucide-react";

// 親コンポーネントから渡されるプロフィール情報の型
type Profile = {
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  department: string | null;
  acquired_qualifications: string[] | null;
};

interface UserProfileCardProps {
  children: React.ReactNode;
  profile: Profile | null;
  total_answers?: number;
  correct_answers?: number;
}

export function UserProfileCard({ 
  children, 
  profile, 
  total_answers,
  correct_answers
}: UserProfileCardProps) {
  // プロフィール情報がない場合は、トリガーとなる要素のみを返す
  if (!profile) {
    return <>{children}</>;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex flex-col gap-4">
          {/* ヘッダー: アバター、名前、所属 */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">
                {profile.username?.charAt(0) || <User />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-lg font-semibold">{profile.username || '名無しさん'}</h4>
              {profile.department && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="mr-2 h-4 w-4" />
                  <span>{profile.department}</span>
                </div>
              )}
            </div>
          </div>

          {/* 自己紹介 */}
          {profile.bio && (
            <p className="text-sm">
              {profile.bio}
            </p>
          )}

          {/* 学習記録 */}
          {(total_answers !== undefined && correct_answers !== undefined) && (
            <div className="space-y-2">
              <h5 className="text-sm font-semibold flex items-center">
                <BarChart className="mr-2 h-4 w-4" />
                学習記録
              </h5>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>総解答数: {total_answers}問</p>
                <p>総正解数: {correct_answers}問</p>
              </div>
            </div>
          )}

          {/* 取得済み資格 */}
          {profile.acquired_qualifications && profile.acquired_qualifications.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-semibold flex items-center">
                <Award className="mr-2 h-4 w-4" />
                取得済み資格
              </h5>
              <div className="flex flex-wrap gap-2">
                {profile.acquired_qualifications.map((qual) => (
                  <Badge key={qual} variant="secondary">{qual}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
