import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { apiFetchAuth, uploadImage } from "../../utils/supabase-client";
import type { Activity, ActivityTestimonial } from "../data/mock-data";

const YEAR_OPTIONS = ["2024", "2025", "2026", "2027"];

interface ActivityFormModalProps {
  activity: Activity | null;
  onClose: () => void;
  onSaved: (activity: Activity) => void;
}

export function ActivityFormModal({ activity, onClose, onSaved }: ActivityFormModalProps) {
  const isEdit = !!activity;

  const [category, setCategory] = useState<"프로젝트" | "해커톤">("프로젝트");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [half, setHalf] = useState<"상반기" | "하반기">("상반기");
  const [infoOpen, setInfoOpen] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [summary, setSummary] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mvpDescription, setMvpDescription] = useState("");
  const [mvpDemoUrl, setMvpDemoUrl] = useState("");
  const [problem, setProblem] = useState("");
  const [discovery, setDiscovery] = useState("");
  const [validation, setValidation] = useState("");
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [slideFileName, setSlideFileName] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<ActivityTestimonial[]>([]);
  const [hidden, setHidden] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activity) return;
    setCategory(activity.category || "프로젝트");
    setYear(activity.year || String(new Date().getFullYear()));
    setHalf(activity.half || "상반기");
    setTeamName(activity.teamName || "");
    setProjectName(activity.projectName || "");
    setSummary(activity.summary || "");
    setImagePreview(activity.imageUrl || null);
    setMvpDescription(activity.mvpDescription || "");
    setMvpDemoUrl(activity.mvpDemoUrl || "");
    setProblem(activity.problem || "");
    setDiscovery(activity.discovery || "");
    setValidation(activity.validation || "");
    setSlideFileName(activity.slideUrl ? activity.slideUrl.split("/").pop() || "기존 파일" : null);
    setTestimonials(activity.testimonials || []);
    setHidden(activity.hidden || false);
  }, [activity]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSlideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlideFile(file);
    setSlideFileName(file.name);
  };

  const addTestimonial = () => {
    setTestimonials([...testimonials, { quote: "", author: "" }]);
  };

  const updateTestimonial = (index: number, field: keyof ActivityTestimonial, value: string) => {
    setTestimonials(testimonials.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const removeTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = activity?.imageUrl;
    let slideUrl = activity?.slideUrl;
    let slideType = activity?.slideType;

    if (!imageFile && !imageUrl) {
      alert("대표 이미지를 첨부해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      if (imageFile) imageUrl = await uploadImage(imageFile);
      if (slideFile) {
        slideUrl = await uploadImage(slideFile);
        slideType = slideFile.type === "application/pdf" ? "pdf" : "image";
      }

      const payload = {
        category,
        year,
        half,
        teamName,
        projectName,
        summary,
        imageUrl,
        mvpDescription,
        mvpDemoUrl: mvpDemoUrl || undefined,
        problem,
        discovery,
        validation,
        slideUrl,
        slideType,
        testimonials: testimonials.filter((t) => t.quote.trim() || t.author.trim()),
        hidden,
        date: activity?.date || new Date().toISOString().split("T")[0],
      };

      const res = isEdit
        ? await apiFetchAuth(`/activities/${activity!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await apiFetchAuth("/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        const data = await res.json();
        onSaved(data.activity);
        alert(isEdit ? "액티비티가 수정되었습니다!" : "액티비티가 추가되었습니다!");
      } else {
        alert(isEdit ? "액티비티 수정에 실패했습니다." : "액티비티 추가에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
  const toggleClass = (active: boolean) =>
    `flex-1 px-4 py-3 rounded-lg border text-sm font-semibold transition-colors ${
      active ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-foreground/30"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">액티비티 {isEdit ? "수정" : "추가"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium mb-2">카테고리 *</label>
            <div className="flex gap-3">
              <button type="button" className={toggleClass(category === "프로젝트")} onClick={() => setCategory("프로젝트")}>
                프로젝트
              </button>
              <button type="button" className={toggleClass(category === "해커톤")} onClick={() => setCategory("해커톤")}>
                해커톤
              </button>
            </div>
          </div>

          {/* 활동년도 / 활동 시기 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">활동년도 *</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} className={inputClass}>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">활동 시기 *</label>
              <div className="flex gap-3">
                <button type="button" className={toggleClass(half === "상반기")} onClick={() => setHalf("상반기")}>
                  상반기
                </button>
                <button type="button" className={toggleClass(half === "하반기")} onClick={() => setHalf("하반기")}>
                  하반기
                </button>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <button
            type="button"
            onClick={() => setInfoOpen(!infoOpen)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <span className={`inline-block transition-transform ${infoOpen ? "rotate-0" : "-rotate-90"}`}>▾</span>
            프로젝트 정보 입력
          </button>

          {infoOpen && (
            <div className="space-y-6">
              {/* 팀명 / 프로젝트명 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">팀명 *</label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">프로젝트명 *</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* 한 줄 요약 */}
              <div>
                <label className="block text-sm font-medium mb-2">한 줄 요약 *</label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="프로젝트를 한 문장으로 소개해주세요"
                  className={inputClass}
                />
              </div>

              {/* 대표 이미지 */}
              <div>
                <label className="block text-sm font-medium mb-2">대표 이미지 *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={`${inputClass} file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20`}
                />
                {imagePreview && (
                  <div className="mt-3">
                    <img src={imagePreview} alt="미리보기" className="max-h-40 rounded-lg border border-border" />
                  </div>
                )}
              </div>

              {/* MVP */}
              <div className="p-4 sm:p-6 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                <label className="block text-sm font-semibold text-primary">MVP *</label>
                <textarea
                  required
                  value={mvpDescription}
                  onChange={(e) => setMvpDescription(e.target.value)}
                  rows={3}
                  placeholder="핵심 기능을 설명해주세요"
                  className={`${inputClass} resize-none bg-background`}
                />
                <input
                  type="text"
                  value={mvpDemoUrl}
                  onChange={(e) => setMvpDemoUrl(e.target.value)}
                  placeholder="데모/프로토타입 링크"
                  className={`${inputClass} bg-background`}
                />
              </div>

              {/* 01/02/03 */}
              <div>
                <label className="block text-sm font-medium mb-2">01 · 문제정의 *</label>
                <textarea
                  required
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={3}
                  placeholder="문제 발견 과정과 배경을 작성해주세요"
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">02 · 핵심 인사이트 *</label>
                <textarea
                  required
                  value={discovery}
                  onChange={(e) => setDiscovery(e.target.value)}
                  rows={3}
                  placeholder="리서치 인사이트와 문제 정의를 작성해주세요"
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">03 · 문제 검증 및 결과 *</label>
                <textarea
                  required
                  value={validation}
                  onChange={(e) => setValidation(e.target.value)}
                  rows={3}
                  placeholder="검증 방법과 결과를 작성해주세요"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* 발표 장표 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  발표 장표 (PDF 1개 또는 이미지 1장, PDF는 페이지별 슬라이드로 노출)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleSlideChange}
                  className={`${inputClass} file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20`}
                />
                {slideFileName && <p className="mt-2 text-sm text-muted-foreground">선택된 파일: {slideFileName}</p>}
              </div>

              {/* 참여자 후기 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">참여자 후기 (선택)</label>
                  <button
                    type="button"
                    onClick={addTestimonial}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    <Plus className="h-4 w-4" /> 후기 추가
                  </button>
                </div>
                <div className="space-y-3">
                  {testimonials.map((t, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={t.quote}
                        onChange={(e) => updateTestimonial(i, "quote", e.target.value)}
                        placeholder="후기 내용"
                        className={`${inputClass} flex-[2]`}
                      />
                      <input
                        type="text"
                        value={t.author}
                        onChange={(e) => updateTestimonial(i, "author", e.target.value)}
                        placeholder="이름, 역할"
                        className={`${inputClass} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => removeTestimonial(i)}
                        className="p-2.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hidden}
                onChange={(e) => setHidden(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
            <span className="text-sm font-medium">숨김 처리 (목록/상세 페이지에 노출 안 함)</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? (isEdit ? "수정 중..." : "추가 중...") : isEdit ? "수정하기" : "추가하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
