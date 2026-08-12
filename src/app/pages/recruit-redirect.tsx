import { useEffect } from "react";
import { apiFetch } from "../../utils/supabase-client";
import { getApplyUrl } from "../types/recruit-config";

// 메인 배포에서 /recruit 접근 시 리크루팅 전용 사이트로 보낸다.
// 지원서 폼이 두 곳에 떠서 헷갈리는 것을 막기 위함 — 실제 지원은 새 배포에서만 받는다.
// 이동 주소는 어드민의 "지원하기 버튼 연결 주소" 설정을 따르고, 불러오기에 실패하면 기본값으로 보낸다.
export function RecruitRedirect() {
  useEffect(() => {
    let cancelled = false;

    apiFetch("/recruit-config")
      .then((r) => r.json())
      .then(({ config }) => {
        if (!cancelled) window.location.replace(getApplyUrl(config));
      })
      .catch(() => {
        if (!cancelled) window.location.replace(getApplyUrl());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full py-32 text-center text-muted-foreground">
      리크루팅 페이지로 이동 중...
    </div>
  );
}
