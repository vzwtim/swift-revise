import { useIsMobile } from "@/hooks/use-mobile";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award, User, BarChart } from "lucide-react";
import { CATEGORY_DISPLAY_NAMES } from "@/lib/constants";

// 親コンポーネントから渡されるプロフィール情報の型
type Profile = {
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  department: string | null;
  acquired_qualifications: string[] | null;
  studying_qualifications: string[] | null; // 新しく追加
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
  const isMobile = useIsMobile();

  // プロフィール情報がない場合は、トリガーとなる要素のみを返す
  if (!profile) {
    return <>{children}</>;
  }

  const cardContent = (
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

      {/* 総解答数 */}
      {(total_answers !== undefined) && (
        <div className="flex items-center pt-2">
          <BarChart className="mr-2 h-4 w-4 opacity-70" />
          <span className="text-xs text-muted-foreground">
            総解答数: {total_answers}問
          </span>
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

      {/* 学習中の資格 (新しく追加) */}
      {profile.studying_qualifications && profile.studying_qualifications.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold flex items-center">
            <Award className="mr-2 h-4 w-4" />
            学習中の資格
          </h5>
          <div className="flex flex-wrap gap-2">
            {profile.studying_qualifications.map((qual) => (
              <Badge key={qual} variant="outline">{CATEGORY_DISPLAY_NAMES[qual] || qual}</Badge> // マッピングを適用
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-80">
          {cardContent}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        {cardContent}
      </HoverCardContent>
    </HoverCard>
  );
}
