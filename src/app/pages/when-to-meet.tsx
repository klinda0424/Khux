import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Calendar, ArrowLeft } from "lucide-react";
import { useReviewUser } from "../../utils/review-auth";

export function WhenToMeet() {
  const navigate = useNavigate();
  const { user, loading } = useReviewUser();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/members/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background px-4 py-10">
      <Link
        to="/"
        className="fixed top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        메인으로
      </Link>

      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">When To Meet</h1>
          <p className="text-muted-foreground">
            학회원들의 가능한 시간을 확인하고, 공통 일정을 찾아보세요.
          </p>
        </div>

        <div className="grid gap-4">
          <div
            onClick={() => navigate("/when-to-meet/members")}
            className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">멤버 일정 확인</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  멤버 목록을 확인하고, 여러 명을 선택해 공통 시간을 찾을 수 있어요.
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate(`/when-to-meet/schedule/${user.discord_id}`)}
            className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">내 스케줄 바로 입력</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  오늘부터 7일간 가능한 시간을 빠르게 등록하세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {user.display_name} ({user.team_name || "팀 없음"}) 으로 로그인됨
        </p>
      </div>
    </div>
  );
}
