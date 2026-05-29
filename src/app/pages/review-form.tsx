import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Send, Check, Crown } from "lucide-react";
import { useReviewUser, reviewApiFetch } from "../../utils/review-auth";
import { ScoreSelector } from "../components/review/score-selector";

interface Criterion {
  name: string;
  desc: string;
}

interface SessionData {
  id: string;
  title: string;
  members: { discord_id: string; display_name: string; is_leader: boolean }[];
  criteria: Criterion[];
  leader_criteria: Criterion[];
}

export function ReviewForm() {
  const navigate = useNavigate();
  const { sessionId, targetId } = useParams();

  const { user, loading: authLoading } = useReviewUser();
  const [session, setSession] = useState<SessionData | null>(null);
  const [commonScores, setCommonScores] = useState<(number | null)[]>([]);
  const [leaderScores, setLeaderScores] = useState<(number | null)[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/review/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !sessionId) return;

    async function fetchData() {
      try {
        const sessionRes = await reviewApiFetch(`/review/sessions/${sessionId}`);
        if (!sessionRes.ok) throw new Error("Session not found");
        const { session: sess } = await sessionRes.json();
        setSession(sess);

        setCommonScores(new Array(sess.criteria.length).fill(null));
        setLeaderScores(new Array(sess.leader_criteria.length).fill(null));

        const reviewsRes = await reviewApiFetch(`/review/sessions/${sessionId}/my-reviews`);
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          const existingCommon = (data.reviews || []).find((r: any) => r.target_id === targetId);
          if (existingCommon) {
            setCommonScores(existingCommon.scores);
            if (existingCommon.comment) setComment(existingCommon.comment);
          }
          const existingLeader = (data.leader_reviews || []).find((r: any) => r.target_id === targetId);
          if (existingLeader) {
            setLeaderScores(existingLeader.scores);
            if (!existingCommon && existingLeader.comment) setComment(existingLeader.comment);
          }
        }
      } catch {
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, sessionId, targetId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="animate-pulse text-foreground/60">로딩 중...</div>
      </div>
    );
  }

  if (!user || !session) return null;

  const target = session.members.find((m) => m.discord_id === targetId);
  const isLeader = target?.is_leader ?? false;

  const commonFilled = commonScores.length > 0 && commonScores.every((s) => s !== null);
  const leaderFilled = !isLeader || (leaderScores.length > 0 && leaderScores.every((s) => s !== null));
  const allScoresFilled = commonFilled && leaderFilled;

  const handleSubmit = async () => {
    if (!allScoresFilled) {
      setError("모든 항목에 점수를 입력해주세요.");
      return;
    }
    if (comment.length < 50) {
      setError("코멘트를 50자 이상 작성해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const commonRes = await reviewApiFetch(`/review/sessions/${sessionId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_discord_id: targetId,
          scores: commonScores,
          comment,
        }),
      });
      if (!commonRes.ok) {
        const data = await commonRes.json().catch(() => ({}));
        throw new Error(data.error || "공통 리뷰 제출 실패");
      }

      if (isLeader) {
        const leaderRes = await reviewApiFetch(`/review/sessions/${sessionId}/leader-reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_discord_id: targetId,
            scores: leaderScores,
            comment,
          }),
        });
        if (!leaderRes.ok) {
          const data = await leaderRes.json().catch(() => ({}));
          throw new Error(data.error || "리더 평가 제출 실패");
        }
      }

      setSubmitted(true);
      setTimeout(() => navigate("/review?list=1"), 1500);
    } catch (err: any) {
      setError(err.message || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-lg font-medium">제출 완료!</p>
          <p className="text-sm text-foreground/60 mt-1">대시보드로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/review?list=1")}
            className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </button>
          <div className="border-l border-border pl-4">
            <p className="font-medium">피어리뷰</p>
            <p className="text-sm text-foreground/60">{session.title}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Target Info */}
        <div className="bg-card border border-border rounded-xl p-6 lg:p-8">
          <p className="text-sm text-foreground/60 mb-2">평가 대상</p>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold">{target?.display_name || "Unknown"}</p>
            {isLeader && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                <Crown className="w-3 h-3" />
                Leader
              </span>
            )}
          </div>
        </div>

        {/* Common Criteria */}
        <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-8">
          <div>
            <h2 className="font-semibold mb-1">공통 평가 항목</h2>
            <p className="text-xs text-foreground/60">팀원에게 공통으로 적용되는 항목입니다.</p>
          </div>
          {session.criteria.map((criterion, index) => (
            <ScoreSelector
              key={criterion.name}
              name={criterion.name}
              description={criterion.desc}
              value={commonScores[index] ?? null}
              onChange={(score) => {
                const next = [...commonScores];
                next[index] = score;
                setCommonScores(next);
              }}
            />
          ))}
        </div>

        {/* Leader Criteria (only for leader targets) */}
        {isLeader && session.leader_criteria.length > 0 && (
          <div className="bg-card border border-amber-200 rounded-xl p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <div>
                <h2 className="font-semibold">리더 추가 평가 항목</h2>
                <p className="text-xs text-foreground/60">리더에게만 적용되는 항목입니다.</p>
              </div>
            </div>
            {session.leader_criteria.map((criterion, index) => (
              <ScoreSelector
                key={criterion.name}
                name={criterion.name}
                description={criterion.desc}
                value={leaderScores[index] ?? null}
                onChange={(score) => {
                  const next = [...leaderScores];
                  next[index] = score;
                  setLeaderScores(next);
                }}
              />
            ))}
          </div>
        )}

        {/* Comment */}
        <div className="bg-card border border-border rounded-xl p-6 lg:p-8">
          <label className="block font-medium mb-3">코멘트 (필수, 50자 이상)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="해당 팀원에 대한 피드백이나 의견을 자유롭게 작성해주세요. (50자 이상)"
            className={`w-full min-h-[160px] p-4 bg-background border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
              comment.length > 0 && comment.length < 50 ? "border-destructive" : "border-border"
            }`}
          />
          <p className={`text-sm mt-2 ${comment.length >= 50 ? "text-green-600" : "text-foreground/60"}`}>
            {comment.length}/50자
          </p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !allScoresFilled || comment.length < 50}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-medium text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          {submitting ? "제출 중..." : "리뷰 제출"}
        </button>
      </div>
    </div>
  );
}
