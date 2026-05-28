import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Users, Shuffle, Send, X, CheckCircle2, Circle } from "lucide-react";
import { useReviewUser, reviewApiFetch } from "../../utils/review-auth";

interface Member {
  discord_id: string;
  display_name: string;
  avatar: string | null;
  is_leader: boolean;
  has_schedule: boolean;
  schedule_until?: string;
}

interface GenGroup {
  label: string;
  subs: { label: string; key: string; members: Member[] }[];
}

interface OverlapSlot {
  date: string;
  label: string;
  hours: number[];
}

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  return `${dateStr.slice(5).replace("-", "/")} (${DAY_KO[d.getDay()]})`;
}

function mergeHoursToRanges(hours: number[]): string {
  if (hours.length === 0) return "";
  const sorted = [...hours].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(end === start ? `${start}시` : `${start}~${end + 1}시`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(end === start ? `${start}시` : `${start}~${end + 1}시`);
  return ranges.join(", ");
}

function computeOverlap(
  schedules: Record<string, { availability: Record<string, number[]> }>
): OverlapSlot[] {
  const ids = Object.keys(schedules);
  if (ids.length === 0) return [];

  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 8; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const result: OverlapSlot[] = [];
  for (const date of dates) {
    let common: number[] | null = null;
    for (const id of ids) {
      const hours = schedules[id]?.availability?.[date] ?? [];
      common = common === null ? hours : common.filter((h) => hours.includes(h));
    }
    if (common && common.length > 0) {
      result.push({ date, label: formatDateLabel(date), hours: common });
    }
  }
  return result;
}

function buildDmText(names: string[], overlap: OverlapSlot[]): string {
  const nameList = names.join(", ");
  const timeList = overlap
    .map((s) => {
      const d = new Date(s.date);
      return `${DAY_KO[d.getDay()]}: ${mergeHoursToRanges(s.hours)}`;
    })
    .join(", ");
  return `[${nameList}] 미팅  ${timeList} 가능하신가요?`;
}

function buildGroups(rawMembers: Record<string, Member[]>): GenGroup[] {
  const allFlat = Object.values(rawMembers).flat();
  const gen3 = allFlat.filter((m) => m.display_name.includes("3기"));
  const gen2 = allFlat.filter((m) => m.display_name.includes("2기"));
  const directors = allFlat.filter(
    (m) => !m.display_name.includes("2기") && !m.display_name.includes("3기") && (m.is_leader || m.display_name.includes("Founder"))
  );
  const split = (arr: Member[], kw: string) =>
    arr.filter((m) => m.display_name.toLowerCase().includes(kw.toLowerCase()));

  return [
    { label: "Director", subs: [{ label: "", key: "director", members: directors }] },
    {
      label: "2기",
      subs: [
        { label: "Brand", key: "gen2_brand", members: split(gen2, "Brand") },
        { label: "PR", key: "gen2_pr", members: split(gen2, "PR") },
        { label: "Ops", key: "gen2_ops", members: split(gen2, "Ops") },
        { label: "Education", key: "gen2_edu", members: split(gen2, "Education") },
      ].filter((s) => s.members.length > 0),
    },
    {
      label: "3기",
      subs: [
        { label: "Brand", key: "gen3_brand", members: split(gen3, "Brand") },
        { label: "PR", key: "gen3_pr", members: split(gen3, "PR") },
        { label: "Ops", key: "gen3_ops", members: split(gen3, "Ops") },
        { label: "Education", key: "gen3_edu", members: split(gen3, "Education") },
      ].filter((s) => s.members.length > 0),
    },
  ].filter((g) => g.subs.some((s) => s.members.length > 0));
}

export function WhenToMeetMembers() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useReviewUser();

  const [groups, setGroups] = useState<GenGroup[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [overlap, setOverlap] = useState<OverlapSlot[] | null>(null);
  const [sorting, setSorting] = useState(false);
  const [dmText, setDmText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: string[]; failed: string[] } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/members/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    reviewApiFetch("/when-to-meet/members")
      .then((r) => r.json())
      .then((data) => {
        const raw: Record<string, Member[]> = data.members ?? {};
        setGroups(buildGroups(raw));
        setAllMembers(Object.values(raw).flat());
      })
      .catch(() => setError("멤버 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [user]);

  function toggleSelect(discordId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(discordId)) next.delete(discordId);
      else next.add(discordId);
      return next;
    });
    setOverlap(null);
    setSendResult(null);
  }

  async function handleSort() {
    if (selected.size < 2) return;
    setSorting(true);
    try {
      const results = await Promise.all(
        [...selected].map(async (id) => {
          const res = await reviewApiFetch(`/when-to-meet/schedule/${id}`);
          const data = await res.json();
          return [id, data.schedule] as [string, any];
        })
      );
      const schedules = Object.fromEntries(results.filter(([, s]) => s !== null));
      const ov = computeOverlap(schedules);
      setOverlap(ov);
      const names = [...selected].map((id) => allMembers.find((m) => m.discord_id === id)?.display_name ?? id);
      setDmText(ov.length > 0 ? buildDmText(names, ov) : "");
    } catch {
      setError("일정을 불러오지 못했습니다.");
    } finally {
      setSorting(false);
    }
  }

  async function handleSendDm() {
    if (!dmText || selected.size === 0) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await reviewApiFetch("/when-to-meet/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discord_ids: [...selected], message: dmText }),
      });
      const data = await res.json();
      setSendResult({ sent: data.sent ?? [], failed: data.failed ?? [] });
    } catch {
      setError("DM 전송에 실패했습니다.");
    } finally {
      setSending(false);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background px-4 py-10">
      <Link
        to="/when-to-meet"
        className="fixed top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        돌아가기
      </Link>

      <div className="max-w-3xl mx-auto pt-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> 멤버 목록
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            이름 옆 <span className="font-medium">보기/수정</span>을 눌러 스케줄을 확인하고, 2명 이상 선택 후 SORT로 공통 시간을 찾으세요.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        {groups.map((gen) => (
          <div key={gen.label} className="mb-8">
            <h2 className="text-base font-bold mb-4 pb-2 border-b border-border">{gen.label}</h2>
            <div className="space-y-4">
              {gen.subs.map((sub) => (
                <div key={sub.key}>
                  {sub.label && (
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {sub.label}
                    </h3>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sub.members.map((m) => {
                      const isSelected = selected.has(m.discord_id);
                      const isMe = m.discord_id === user.discord_id;
                      return (
                        <div
                          key={m.discord_id}
                          className={`relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                          }`}
                          onClick={() => toggleSelect(m.discord_id)}
                        >
                          <div className="shrink-0">
                            {isSelected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {m.display_name}
                              {isMe && <span className="ml-1 text-xs text-primary">(나)</span>}
                            </p>
                            <p className={`text-xs ${m.has_schedule ? "text-green-500" : "text-muted-foreground"}`}>
                              {m.has_schedule
                                ? m.schedule_until ? `~${m.schedule_until}까지 등록됨` : "등록됨"
                                : "미등록"}
                            </p>
                          </div>
                          <button
                            className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                            onClick={(e) => { e.stopPropagation(); navigate(`/when-to-meet/schedule/${m.discord_id}`); }}
                          >
                            {isMe ? "수정" : "보기"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {selected.size >= 2 && (
          <div className="sticky bottom-6 mt-6">
            <div className="bg-card border border-border rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">{selected.size}명 선택됨</span>
                <button onClick={() => { setSelected(new Set()); setOverlap(null); setSendResult(null); }}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <button
                onClick={handleSort}
                disabled={sorting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Shuffle className="h-4 w-4" />
                {sorting ? "분석 중..." : "SORT — 공통 시간 찾기"}
              </button>

              {overlap !== null && (
                <div className="mt-4">
                  {overlap.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-2">공통으로 가능한 시간이 없습니다.</p>
                  ) : (
                    <>
                      <div className="mb-3 space-y-1">
                        {overlap.map((slot) => (
                          <div key={slot.date} className="text-sm">
                            <span className="font-medium">{slot.label}</span>
                            <span className="text-muted-foreground ml-2">{mergeHoursToRanges(slot.hours)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground mb-1">Discord DM 메세지 (수정 가능)</p>
                        <textarea
                          value={dmText}
                          onChange={(e) => setDmText(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                          rows={3}
                        />
                        <button
                          onClick={handleSendDm}
                          disabled={sending || !dmText}
                          className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#5865F2] text-white rounded-lg text-sm font-medium hover:bg-[#4752C4] transition-colors disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          {sending ? "전송 중..." : "Discord로 보내기"}
                        </button>
                        {sendResult && (
                          <div className="mt-2 text-xs space-y-0.5">
                            {sendResult.sent.length > 0 && (
                              <p className="text-green-500">전송 완료: {sendResult.sent.map((id) => allMembers.find((m) => m.discord_id === id)?.display_name ?? id).join(", ")}</p>
                            )}
                            {sendResult.failed.length > 0 && (
                              <p className="text-destructive">전송 실패: {sendResult.failed.map((id) => allMembers.find((m) => m.discord_id === id)?.display_name ?? id).join(", ")}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
