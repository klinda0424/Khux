import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { useReviewUser, reviewApiFetch } from "../../utils/review-auth";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

function getDates(): string[] {
  const today = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date().toISOString().slice(0, 10);
  return { label: dateStr === today ? "오늘" : DAY_KO[d.getDay()], date: dateStr.slice(5).replace("-", "/") };
}

export function WhenToMeetSchedule() {
  const { discordId } = useParams<{ discordId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useReviewUser();

  const dates = getDates();
  const isOwn = user?.discord_id === discordId;

  const [availability, setAvailability] = useState<Record<string, Set<number>>>({});
  const [targetName, setTargetName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove">("add");

  useEffect(() => {
    if (!authLoading && !user) navigate("/members/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!discordId || !user) return;
    reviewApiFetch(`/when-to-meet/schedule/${discordId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.schedule) {
          const avail: Record<string, Set<number>> = {};
          for (const [date, hours] of Object.entries(data.schedule.availability as Record<string, number[]>)) {
            avail[date] = new Set(hours);
          }
          setAvailability(avail);
          setTargetName(data.schedule.display_name || "");
        } else if (isOwn) {
          setTargetName(user.display_name);
        }
      })
      .catch(() => setError("일정을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [discordId, user]);

  const toggleCell = useCallback((date: string, hour: number, forceMode?: "add" | "remove") => {
    if (!isOwn) return;
    setAvailability((prev) => {
      const next = { ...prev };
      const set = new Set(next[date] ?? []);
      const mode = forceMode ?? (set.has(hour) ? "remove" : "add");
      if (mode === "add") set.add(hour); else set.delete(hour);
      next[date] = set;
      return next;
    });
    setSaved(false);
  }, [isOwn]);

  function handleMouseDown(date: string, hour: number) {
    if (!isOwn) return;
    const mode = (availability[date] ?? new Set()).has(hour) ? "remove" : "add";
    setDragMode(mode);
    setIsDragging(true);
    toggleCell(date, hour, mode);
  }

  function handleMouseEnter(date: string, hour: number) {
    if (!isDragging || !isOwn) return;
    toggleCell(date, hour, dragMode);
  }

  useEffect(() => {
    const stop = () => setIsDragging(false);
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  async function handleSave() {
    if (!isOwn) return;
    setSaving(true);
    try {
      const serialized: Record<string, number[]> = {};
      for (const [date, set] of Object.entries(availability)) {
        if (set.size > 0) serialized[date] = [...set].sort((a, b) => a - b);
      }
      const res = await reviewApiFetch("/when-to-meet/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: serialized }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="animate-pulse text-muted-foreground">불러오는 중...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background px-2 py-10 select-none">
      <Link
        to="/when-to-meet/members"
        className="fixed top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      <div className="max-w-5xl mx-auto pt-14 pb-24">
        <div className="mb-6 px-2">
          <h1 className="text-2xl font-bold">
            {isOwn ? "내 스케줄 입력" : `${targetName || discordId}의 스케줄`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isOwn ? "가능한 시간대를 클릭하거나 드래그해서 선택하세요. (초록색 = 가능)" : "읽기 전용 — 본인 일정만 수정할 수 있어요."}
          </p>
        </div>

        {error && (
          <div className="mb-4 mx-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>
        )}

        <div className="overflow-x-auto px-2">
          <div className="min-w-max">
            <div className="flex">
              <div className="w-12 shrink-0" />
              {dates.map((date) => {
                const { label, date: dateShort } = formatDateHeader(date);
                return (
                  <div key={date} className="w-14 text-center shrink-0">
                    <div className="text-xs font-semibold">{label}</div>
                    <div className="text-xs text-muted-foreground">{dateShort}</div>
                  </div>
                );
              })}
            </div>
            {HOURS.map((hour) => (
              <div key={hour} className="flex items-center">
                <div className="w-12 shrink-0 text-right pr-2 text-xs text-muted-foreground">{hour}시</div>
                {dates.map((date) => {
                  const isActive = availability[date]?.has(hour) ?? false;
                  return (
                    <div
                      key={date}
                      className={`w-14 h-8 shrink-0 border-b border-r border-border/50 transition-colors
                        ${isActive ? "bg-green-500/70 hover:bg-green-500/80" : isOwn ? "bg-muted/30 hover:bg-muted/60 cursor-pointer" : "bg-muted/20"}
                        ${hour === HOURS[0] ? "border-t" : ""} ${date === dates[0] ? "border-l" : ""}`}
                      onMouseDown={() => handleMouseDown(date, hour)}
                      onMouseEnter={() => handleMouseEnter(date, hour)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 px-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-green-500/70" /> 가능</div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-muted/30 border border-border/50" /> 불가능</div>
        </div>
      </div>

      {isOwn && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur border-t border-border">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            {saved && <span className="flex items-center gap-1 text-sm text-green-500"><CheckCircle2 className="h-4 w-4" /> 저장됨</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto flex items-center gap-2 py-2.5 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
