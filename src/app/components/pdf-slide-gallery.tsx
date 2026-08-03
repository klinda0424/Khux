import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfSlideGalleryProps {
  fileUrl: string;
  fileType: "image" | "pdf";
}

export function PdfSlideGallery({ fileUrl, fileType }: PdfSlideGalleryProps) {
  const [slides, setSlides] = useState<string[]>([]);
  const [loading, setLoading] = useState(fileType === "pdf");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fileType === "image") {
      setSlides([fileUrl]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          if (!context) continue;
          await page.render({ canvasContext: context, viewport, canvas }).promise;
          pages.push(canvas.toDataURL("image/png"));
        }
        if (!cancelled) setSlides(pages);
      } catch (error) {
        console.error("Failed to render PDF slides:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, fileType]);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        장표를 불러오는 중...
      </div>
    );
  }

  if (slides.length === 0) return null;

  return (
    <div>
      <div className="relative group">
        {slides.length > 1 && (
          <button
            type="button"
            onClick={() => scrollBy(-320)}
            className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-8 h-8 rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors"
            aria-label="이전 장표"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scroll-smooth pb-2">
          {slides.map((src, i) => (
            <div key={i} className="shrink-0 w-[220px] sm:w-[260px] rounded-lg overflow-hidden border border-border bg-muted">
              <img src={src} alt={`장표 ${i + 1}`} className="w-full h-auto object-contain" />
              {slides.length > 1 && (
                <div className="text-center text-xs text-muted-foreground py-1 border-t border-border">
                  {String(i + 1).padStart(2, "0")}
                </div>
              )}
            </div>
          ))}
        </div>
        {slides.length > 1 && (
          <button
            type="button"
            onClick={() => scrollBy(320)}
            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-8 h-8 rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors"
            aria-label="다음 장표"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      {slides.length > 1 && (
        <p className="text-xs text-muted-foreground mt-2">← 옆으로 슬라이드해서 전체 장표 보기</p>
      )}
    </div>
  );
}
