import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { useReviewUser } from "../../utils/review-auth";
import { mockNotices, CATEGORIES, NoticeList } from "./notice";

export function MembersNotice() {
  const navigate = useNavigate();
  const { user, loading } = useReviewUser();
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/members/login?redirect=/members/notice");
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  const filtered = mockNotices.filter((n) => {
    const matchCategory = selectedCategory === "전체" || n.category === selectedCategory;
    const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const sortedNotices = [
    ...filtered.filter((n) => n.important),
    ...filtered.filter((n) => !n.important),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* 헤더 */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/members"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Members Only
          </Link>
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
            <Lock className="w-3 h-3" />
            Members Only
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">공지사항</h1>
          <p className="text-muted-foreground text-lg">
            학회원 전용 공지사항입니다. {user.display_name}님 안녕하세요!
          </p>
        </div>

        <NoticeList
          notices={sortedNotices}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          expandedId={expandedId}
          onExpandChange={setExpandedId}
        />
      </div>
    </div>
  );
}
