import { useState } from "react";
import { ChevronDown, ChevronUp, Pin } from "lucide-react";

interface NoticeItem {
  id: number;
  title: string;
  category: string;
  date: string;
  content: string;
  important: boolean;
  membersOnly: boolean;
  author: string;
  views: number;
}

// 실제 공지 데이터 연동 전까지 목업 비활성화.
// 이전 목업 콘텐츠는 태그 mock-notices-recruiting-2026-07 에서 확인 가능
// (다음 리크루팅 시즌에 재사용 예정).
const mockNotices: NoticeItem[] = [];

const CATEGORIES = ["전체", "모집", "세미나", "안내", "특강"];

export function Notice() {
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 공개 페이지: membersOnly 공지는 완전히 제외
  const publicNotices = mockNotices.filter((n) => !n.membersOnly);

  const filtered = publicNotices.filter((n) => {
    const matchCategory = selectedCategory === "전체" || n.category === selectedCategory;
    const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const sortedNotices = [
    ...filtered.filter((n) => n.important),
    ...filtered.filter((n) => !n.important),
  ];

  return (
    <div className="w-full py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">공지사항</h1>
          <p className="text-muted-foreground text-lg">KHUX 학회의 공지사항을 확인하세요.</p>
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

// ── 공용 공지 목록 UI ─────────────────────────────────────────────────────
export function NoticeList({
  notices,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  expandedId,
  onExpandChange,
}: {
  notices: NoticeItem[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedCategory: string;
  onCategoryChange: (v: string) => void;
  expandedId: number | null;
  onExpandChange: (id: number | null) => void;
}) {
  return (
    <>
      <div className="mb-6">
        <input
          type="text"
          placeholder="공지사항 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mb-8 flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-4">총 {notices.length}개의 공지사항</p>

      <div className="flex flex-col divide-y divide-border border rounded-xl overflow-hidden">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`cursor-pointer transition-colors ${
              notice.important ? "bg-primary/5" : "bg-background"
            } hover:bg-accent/40`}
            onClick={() => onExpandChange(expandedId === notice.id ? null : notice.id)}
          >
            <div className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {notice.important && <Pin className="w-4 h-4 text-primary shrink-0" />}
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  notice.category === "모집" ? "bg-green-100 text-green-700" :
                  notice.category === "세미나" ? "bg-blue-100 text-blue-700" :
                  notice.category === "특강" ? "bg-purple-100 text-purple-700" :
                  "bg-accent text-muted-foreground"
                }`}>
                  {notice.category}
                </span>
                <span className="font-medium text-sm truncate">{notice.title}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                <span className="hidden sm:block">{notice.author}</span>
                <span>{notice.date}</span>
                <span className="hidden sm:block">조회 {notice.views}</span>
                {expandedId === notice.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {expandedId === notice.id && (
              <div className="px-5 pb-5 pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">{notice.content}</p>
              </div>
            )}
          </div>
        ))}

        {notices.length === 0 && (
          <div className="text-center py-20 text-muted-foreground text-sm">검색 결과가 없습니다.</div>
        )}
      </div>
    </>
  );
}

export { mockNotices, CATEGORIES };
export type { NoticeItem };
