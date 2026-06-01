import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ClipboardCheck, Calendar, Bell, ArrowLeft, LogOut } from "lucide-react";
import { useReviewUser } from "../../utils/review-auth";

export function Members() {
  const navigate = useNavigate();
  const { user, loading, logout } = useReviewUser();

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

  const handleLogout = async () => {
    await logout();
    navigate("/members/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background px-4 py-10">
      <Link
        to="/"
        className="fixed top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        메인으로
      </Link>

      <button
        onClick={handleLogout}
        className="fixed top-6 right-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        title="로그아웃"
      >
        <LogOut className="h-4 w-4" />
        로그아웃
      </button>

      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Members Only</h1>
          <p className="text-muted-foreground">
            KHUX 학회원 전용 메뉴입니다.
          </p>
        </div>

        <div className="grid gap-4">
          <div
            onClick={() => navigate("/review")}
            className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-primary/10 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-primary/20 transition-colors">
                <ClipboardCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">피어리뷰</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  진행 중인 피어리뷰 세션을 확인하고 리뷰를 작성하세요.
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate("/when-to-meet")}
            className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-500/10 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-500/20 transition-colors">
                <Calendar className="h-6 w-6 text-green-700 dark:text-green-500" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">When To Meet</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  학회원들의 가능한 시간을 확인하고 공통 일정을 찾아보세요.
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate("/members/notice")}
            className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
                <Bell className="h-6 w-6 text-blue-700 dark:text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">공지사항</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  학회원 전용 공지사항을 확인하세요.
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
