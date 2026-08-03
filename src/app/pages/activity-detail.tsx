import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import type { Activity } from "../data/mock-data";
import { apiFetch } from "../../utils/supabase-client";
import { PdfSlideGallery } from "../components/pdf-slide-gallery";

export function ActivityDetail() {
  const { id } = useParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;
      try {
        const res = await apiFetch(`/activities/${id}`);
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setActivity(data.activity);
      } catch (error) {
        console.error("Error fetching activity:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !activity) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/#activities"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            활동 내역으로
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-semibold">
              {activity.category}
            </span>
            <span className="text-sm text-muted-foreground">{activity.teamName}</span>
          </div>

          {/* 대표 이미지 */}
          {activity.imageUrl && (
            <div className="mb-8 rounded-2xl overflow-hidden bg-muted aspect-video">
              <img src={activity.imageUrl} alt={activity.projectName} className="w-full h-full object-cover" />
            </div>
          )}

          {/* 타이틀 / 요약 */}
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{activity.projectName}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">{activity.summary}</p>

          {/* MVP */}
          <div className="mb-10 p-5 sm:p-6 bg-primary/5 border border-primary/20 rounded-xl">
            <h3 className="text-sm font-bold text-primary mb-2">MVP</h3>
            <p className="leading-relaxed whitespace-pre-line">{activity.mvpDescription}</p>
            {activity.mvpDemoUrl && (
              <a
                href={activity.mvpDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium mt-3"
              >
                프로토타입 데모 보러가기
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {/* 01 / 02 / 03 */}
          <div className="space-y-8 mb-10">
            <section>
              <h3 className="text-lg font-bold mb-2">01 · 문제정의</h3>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{activity.problem}</p>
            </section>
            <section>
              <h3 className="text-lg font-bold mb-2">02 · 핵심 인사이트</h3>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{activity.discovery}</p>
            </section>
            <section>
              <h3 className="text-lg font-bold mb-2">03 · 문제 검증 및 결과</h3>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{activity.validation}</p>
            </section>
          </div>

          {/* 발표 장표 */}
          {activity.slideUrl && activity.slideType && (
            <div className="mb-10">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">발표 장표</h3>
              <PdfSlideGallery fileUrl={activity.slideUrl} fileType={activity.slideType} />
            </div>
          )}

          {/* 참여자 후기 */}
          {activity.testimonials && activity.testimonials.length > 0 && (
            <div className="pt-8 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">참여자 후기</h3>
              <div className="space-y-4">
                {activity.testimonials.map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {t.author?.trim().charAt(0) || "?"}
                    </div>
                    <p className="text-foreground/90 leading-relaxed">
                      "{t.quote}"{t.author && <span className="text-muted-foreground"> — {t.author}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
