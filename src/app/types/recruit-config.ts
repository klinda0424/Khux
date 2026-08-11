export interface RecruitBasicField {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "tel" | "email" | "select";
  required: boolean;
  visible: boolean;
  deletable?: boolean;
  options?: string[]; // type이 "select"일 때만 사용
  excludeGroup?: string; // 같은 그룹명을 가진 select 항목끼리 이미 선택된 값을 서로 제외 (예: 지망 순위)
}

export interface RecruitQuestion {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  visible: boolean;
  type: "textarea" | "url" | "text" | "select" | "checkbox" | "file" | "portfolio";
  rows?: number;
  maxLength?: number; // type이 "textarea"일 때 글자수 제한 (선택)
  deletable?: boolean; // custom questions can be fully deleted
  options?: string[]; // type이 "select"일 때만 사용
  excludeGroup?: string; // 같은 그룹명을 가진 select 항목끼리 이미 선택된 값을 서로 제외
  // 필수 항목이지만 라벨 끝의 "*" 표시만 감추고 싶을 때 사용.
  // (여러 줄짜리 긴 라벨에서 "*"가 마지막 줄 끝에 덩그러니 붙는 걸 피하기 위함)
  hideRequiredMark?: boolean;
}

export interface RecruitTeam {
  id: string;
  name: string;
  desc: string;
}

export interface RecruitConfig {
  generation: string;
  isOpen: boolean;
  description: string;
  applicationStart: string;
  applicationEnd: string;
  interviewStart: string;
  interviewEnd: string;
  resultDate: string;
  basicFields: RecruitBasicField[];
  questions: RecruitQuestion[];
  teams: RecruitTeam[];
}

export const KV_KEY = "recruit:config";

export const DEFAULT_RECRUIT_CONFIG: RecruitConfig = {
  generation: "KHUX 4기",
  // 배포판에서 recruit 페이지 콘텐츠 숨김 처리를 위해 false 로 설정.
  // 실제 모집 시작 시 true 로 되돌리면 됨 (원래 값: true).
  isOpen: false,
  description: "UX/UI에 관심 있는 경희대학교 학생이라면 누구나 지원 가능합니다.",
  applicationStart: "2026-03-14",
  applicationEnd: "2026-05-05",
  interviewStart: "2026-05-08",
  interviewEnd: "2026-05-12",
  resultDate: "2026-05-15",
  teams: [
    { id: "team_education",  name: "Education",  desc: "UX/UI 커리큘럼 기획 및 교육 콘텐츠 제작" },
    { id: "team_operations", name: "Operations", desc: "학회 운영 관리 및 조직 문화 구축" },
    { id: "team_growth",     name: "Growth",     desc: "브랜드 전략 수립 및 대외 활동 주도" },
  ],
  basicFields: [
    { id: "name",      label: "이름",    placeholder: "홍길동",            type: "text",   required: true,  visible: true },
    { id: "studentId", label: "학번",    placeholder: "2024XXXXXX",       type: "text",   required: true,  visible: true },
    { id: "major",     label: "학과",    placeholder: "산업디자인학과",    type: "text",   required: true,  visible: true },
    { id: "phone",     label: "연락처",  placeholder: "010-0000-0000",    type: "tel",    required: true,  visible: true },
    { id: "email",     label: "이메일",  placeholder: "example@khu.ac.kr", type: "email", required: true,  visible: true },
    { id: "team",      label: "지원 팀", placeholder: "팀을 선택해주세요",  type: "select", required: true,  visible: true, options: ["Education", "Operations", "Growth"] },
  ],
  questions: [
    {
      id: "motivation",
      label: "지원 동기",
      placeholder: "KHUX에 지원하게 된 동기와 학회에서 이루고 싶은 목표를 자유롭게 작성해주세요.",
      required: true,
      visible: true,
      type: "textarea",
      rows: 5,
      deletable: true,
    },
    {
      id: "experience",
      label: "관련 경험",
      placeholder: "UX/UI 관련 경험이나 프로젝트가 있다면 작성해주세요. (선택)",
      required: false,
      visible: true,
      type: "textarea",
      rows: 4,
      deletable: true,
    },
    {
      id: "portfolio",
      label: "포트폴리오",
      placeholder: "링크(URL) 또는 PDF 파일로 제출해주세요. (선택)",
      required: false,
      visible: true,
      type: "portfolio",
      deletable: true,
    },
  ],
};

/** "2026-03-14" → "2026.03.14" */
export function formatDate(iso: string): string {
  return iso.replace(/-/g, ".");
}

/**
 * 라벨을 대괄호 구간과 일반 텍스트 구간으로 쪼갠다.
 * 예) "[Deep Dive] 본질을 파고듭니다" → [{bold:true,"[Deep Dive]"}, {bold:false," 본질을 파고듭니다"}]
 * 대괄호로 감싼 키워드(핵심 가치명 등)를 강조해 보여주기 위해 사용.
 */
export function splitBracketSegments(label: string): { text: string; bold: boolean }[] {
  const segments: { text: string; bold: boolean }[] = [];
  const re = /\[[^\]\n]*\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(label)) !== null) {
    if (m.index > last) segments.push({ text: label.slice(last, m.index), bold: false });
    segments.push({ text: m[0], bold: true });
    last = m.index + m[0].length;
  }
  if (last < label.length) segments.push({ text: label.slice(last), bold: false });
  return segments;
}
