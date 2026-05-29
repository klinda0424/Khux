import { useState, useRef, useCallback, useEffect } from "react";
import { ImageIcon, Eye, Edit2, Bold, Italic, Heading1, Heading2, List, ListOrdered, Minus, Link, Quote } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import TurndownService from "turndown";
import { uploadImage, proxyUploadImage } from "../../utils/supabase-client";

const turndown = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

turndown.addRule("images", {
  filter: "img",
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const src = el.getAttribute("src") || "";
    const alt = el.getAttribute("alt") || "image";
    return `\n![${alt}](${src})\n`;
  },
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// ── Resize handle (left / right) ──────────────────────────────────────────
function ResizeHandle({ side, onMouseDown }: {
  side: "left" | "right";
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center
        w-5 h-16 cursor-ew-resize select-none
        ${side === "left" ? "left-1" : "right-1"}`}
      onMouseDown={onMouseDown}
    >
      <div className="w-1.5 h-12 rounded-full bg-black/35 hover:bg-black/60 transition-colors backdrop-blur-sm" />
    </div>
  );
}

// ── Resizable image (editor preview only) ─────────────────────────────────
function ResizableImage({ src, alt, style, onResize }: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  onResize?: (src: string, newWidth: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [tooltip, setTooltip] = useState("");

  const initialWidth = (style?.width as string) || "100%";

  // sync width to DOM on first render / prop change
  useEffect(() => {
    if (containerRef.current) containerRef.current.style.width = initialWidth;
  }, [initialWidth]);

  const startDrag = (e: React.MouseEvent, side: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container?.parentElement) return;

    const startX = e.clientX;
    const startW = container.offsetWidth;
    const parentW = container.parentElement.offsetWidth;

    setDragging(true);

    const onMove = (ev: MouseEvent) => {
      const delta = side === "right" ? ev.clientX - startX : startX - ev.clientX;
      const newW = Math.max(80, Math.min(startW + delta, parentW));
      const pct = Math.round((newW / parentW) * 100);
      container.style.width = `${pct}%`;
      setTooltip(`${pct}%`);
    };

    const onUp = () => {
      const pct = Math.round((container.offsetWidth / parentW) * 100);
      setDragging(false);
      setTooltip("");
      onResize?.(src, `${pct}%`);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const showHandles = hovered || dragging;

  return (
    <div
      ref={containerRef}
      style={{ width: initialWidth }}
      className="relative block mx-auto max-w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!dragging) setHovered(false); }}
    >
      <img src={src} alt={alt} loading="lazy" className="w-full h-auto rounded-lg block" />

      {showHandles && (
        <>
          <ResizeHandle side="left"  onMouseDown={(e) => startDrag(e, "left")} />
          <ResizeHandle side="right" onMouseDown={(e) => startDrag(e, "right")} />
        </>
      )}

      {tooltip && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/75 text-white text-xs rounded-md pointer-events-none select-none">
          {tooltip}
        </div>
      )}
    </div>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────
export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const insertAtCursor = useCallback((text: string) => {
    const ta = textareaRef.current;
    const cur = valueRef.current;
    const pos = ta ? ta.selectionStart : cur.length;
    const newValue = cur.slice(0, pos) + text + cur.slice(pos);
    onChange(newValue);
    valueRef.current = newValue;
  }, [onChange]);

  const insertText = useCallback((before: string, after = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const cur = valueRef.current;
    const selected = cur.slice(start, end);
    const newText = cur.slice(0, start) + before + selected + after + cur.slice(end);
    onChange(newText);
    valueRef.current = newText;
    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + before.length + selected.length;
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  }, [onChange]);

  // Update image width in markdown source after drag-resize
  const handleImageResize = useCallback((imgSrc: string, newWidth: string) => {
    const escaped = imgSrc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let v = valueRef.current;

    // 1. <img> tag with existing style → replace style value
    v = v.replace(
      new RegExp(`(<img[^>]*src="${escaped}"[^>]*?)style="[^"]*"`, "g"),
      `$1style="width: ${newWidth}; max-width: 100%;"`
    );

    // 2. <img> tag without style → add style before />
    v = v.replace(
      new RegExp(`(<img(?![^>]*style=)[^>]*src="${escaped}"[^>]*?)\\s*/>`, "g"),
      `$1 style="width: ${newWidth}; max-width: 100%;" />`
    );

    // 3. Markdown image ![alt](url) → convert to <img> with width
    v = v.replace(
      new RegExp(`!\\[([^\\]]*)\\]\\(${escaped}\\)`, "g"),
      (_, alt) => `<img src="${imgSrc}" alt="${alt}" style="width: ${newWidth}; max-width: 100%;" />`
    );

    onChange(v);
    valueRef.current = v;
  }, [onChange]);

  const handleImageUpload = useCallback(async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      setUploading(true);
      setUploadStatus("이미지 업로드 중...");
      let url: string;
      try {
        url = await uploadImage(file);
      } catch {
        alert("이미지 업로드에 실패했습니다.");
        setUploading(false);
        setUploadStatus("");
        continue;
      }
      setUploading(false);
      setUploadStatus("");
      const altText = file.name === "image.png" ? "image" : file.name.replace(/\.[^.]+$/, "");
      insertAtCursor(`\n![${altText}](${url})\n`);
      setMode("preview");
    }
  }, [insertAtCursor]);

  const processHtmlPaste = useCallback(async (html: string) => {
    let markdown = turndown.turndown(html);

    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: { full: string; alt: string; url: string }[] = [];
    let match;
    while ((match = imgRegex.exec(markdown)) !== null) {
      images.push({ full: match[0], alt: match[1], url: match[2] });
    }

    if (images.length === 0) { insertAtCursor(markdown); return; }

    setUploading(true);
    let processed = markdown;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      setUploadStatus(`이미지 업로드 중... (${i + 1}/${images.length})`);
      try {
        if (img.url.startsWith("data:") && img.url.length < 200) {
          processed = processed.replace(img.full, "");
          continue;
        }
        let newUrl: string;
        if (img.url.startsWith("data:image/")) {
          const res = await fetch(img.url);
          const blob = await res.blob();
          const file = new File([blob], `pasted-image-${i + 1}.png`, { type: blob.type });
          newUrl = await uploadImage(file);
        } else if (img.url.startsWith("http")) {
          try { newUrl = await proxyUploadImage(img.url); } catch { newUrl = img.url; }
        } else { continue; }
        processed = processed.replace(img.url, newUrl);
      } catch { /* skip */ }
    }

    setUploading(false);
    setUploadStatus("");
    insertAtCursor(processed);
    setMode("preview");
  }, [insertAtCursor]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    const html = e.clipboardData.getData("text/html");
    if (imageFiles.length > 0 && !html) { e.preventDefault(); handleImageUpload(imageFiles); return; }
    if (html) {
      const hasRich = /<(h[1-6]|p|img|ul|ol|blockquote|hr|strong|em|table)/i.test(html);
      if (hasRich) { e.preventDefault(); processHtmlPaste(html); return; }
    }
    if (imageFiles.length > 0) { e.preventDefault(); handleImageUpload(imageFiles); }
  }, [handleImageUpload, processHtmlPaste]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleImageUpload(e.dataTransfer.files);
  }, [handleImageUpload]);

  const toolbarButtons = [
    { icon: Bold,         action: () => insertText("**", "**"),    title: "굵게" },
    { icon: Italic,       action: () => insertText("*", "*"),      title: "기울임" },
    { icon: Heading1,     action: () => insertText("\n## ", "\n"), title: "제목" },
    { icon: Heading2,     action: () => insertText("\n### ", "\n"),title: "소제목" },
    { icon: Quote,        action: () => insertText("\n> ", "\n"),  title: "인용" },
    { icon: List,         action: () => insertText("\n- ", "\n"),  title: "목록" },
    { icon: ListOrdered,  action: () => insertText("\n1. ", "\n"), title: "번호 목록" },
    { icon: Minus,        action: () => insertText("\n---\n"),     title: "구분선" },
    { icon: Link,         action: () => insertText("[", "](url)"), title: "링크" },
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1 flex-1">
          {toolbarButtons.map(({ icon: Icon, action, title }) => (
            <button key={title} type="button" onClick={action} title={title}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <button type="button" onClick={() => fileInputRef.current?.click()} title="이미지 삽입"
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            disabled={uploading}>
            <ImageIcon className="h-4 w-4" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)} />
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {(["write", "preview"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-colors ${
                mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              {m === "write" ? <><Edit2 className="h-3.5 w-3.5" />작성</> : <><Eye className="h-3.5 w-3.5" />미리보기</>}
            </button>
          ))}
        </div>
      </div>

      {/* Editor / Preview */}
      {mode === "write" ? (
        <div className="relative">
          <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
            placeholder={placeholder || "마크다운으로 작성하세요... 이미지를 드롭하거나 붙여넣기 후 미리보기에서 드래그로 크기 조정하세요."}
            className="w-full min-h-[400px] px-4 py-3 bg-background text-foreground focus:outline-none resize-y font-mono text-sm leading-relaxed" />
          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                {uploadStatus || "처리 중..."}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-[400px] px-4 py-3">
          {value
            ? <MarkdownRenderer content={value} onResize={handleImageResize} />
            : <p className="text-muted-foreground text-sm">미리보기할 내용이 없습니다.</p>
          }
        </div>
      )}
    </div>
  );
}

// ── Renderer (used in editor preview + article pages) ─────────────────────
export function MarkdownRenderer({
  content,
  onResize,
}: {
  content: string;
  onResize?: (src: string, newWidth: string) => void;
}) {
  return (
    <div className="prose prose-lg max-w-none prose-invert
      prose-headings:font-bold prose-headings:tracking-tight
      prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
      prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
      prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
      prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-4
      prose-img:rounded-lg prose-img:my-0 prose-img:mx-auto prose-img:max-w-full
      prose-hr:border-border prose-hr:my-8
      prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
      prose-strong:text-foreground
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-li:text-foreground/90
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ children, ...props }) => {
            const arr = Array.isArray(children) ? children : [children];
            const imgs = arr.filter((c: any) => c?.type === "img" || c?.props?.node?.tagName === "img");
            const nonEmpty = arr.filter((c: any) => c !== "\n" && c !== " " && c !== "");

            if (imgs.length >= 2 && imgs.length === nonEmpty.length) {
              const cols = imgs.length === 2 ? "grid-cols-2" : imgs.length === 3 ? "grid-cols-3" : "grid-cols-2";
              return (
                <div className={`not-prose grid ${cols} gap-3 my-6`}>
                  {arr.map((child: any, i) => {
                    if (child === "\n" || child === " " || child === "") return null;
                    return <div key={i} className="overflow-hidden rounded-lg">{child}</div>;
                  })}
                </div>
              );
            }
            if (imgs.length === 1 && imgs.length === nonEmpty.length) {
              return <div className="my-6">{children}</div>;
            }
            return <p {...props}>{children}</p>;
          },
          img: ({ src, alt, style, ...props }) => {
            const s = style as React.CSSProperties | undefined;
            if (onResize) {
              return (
                <ResizableImage
                  src={src || ""}
                  alt={alt || ""}
                  style={s}
                  onResize={onResize}
                />
              );
            }
            const hasCustomWidth = s?.width !== undefined;
            return (
              <img src={src} alt={alt || ""} loading="lazy" style={s}
                className={`rounded-lg h-auto object-cover ${hasCustomWidth ? "max-w-full" : "w-full"}`}
                {...props} />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
