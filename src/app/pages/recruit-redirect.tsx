import { useEffect } from "react";
import { SITE_LINKS } from "../data/site-links";

// 메인 배포에서 /recruit 접근 시 리크루팅 전용 사이트로 보낸다.
// 지원서 폼이 두 곳에 떠서 헷갈리는 것을 막기 위함 — 실제 지원은 새 배포에서만 받는다.
export function RecruitRedirect() {
  useEffect(() => {
    window.location.replace(SITE_LINKS.recruitSite);
  }, []);

  return (
    <div className="w-full py-32 text-center text-muted-foreground">
      리크루팅 페이지로 이동 중...
    </div>
  );
}
