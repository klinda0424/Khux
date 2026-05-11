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

const SIZE_PRESETS = [
  { label: "소형", value: "25%" },
  { label: "중형", value: "50%" },
  { label: "대형", value: "75%" },
  { label: "전체", value: "100%" },
];

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [sizeDialog, setSizeDialog] = useState<{ url: string; alt: string } | null>(null);
  const [imageSize, setImageSize] = useState("100%");
  const sizeResolveRef = useRef<((size: string | null) => void) | null>(null);
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

  const insertText = useCallback((before: string, after: string = "") => {
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

  const openSizeDialog = useCallback((url: string, alt: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setSizeDialog({ url, alt });
      setImageSize("100%");
      sizeResolveRef.current = resolve;
    });
  }, []);

  const handleSizeConfirm = () => {
    if (sizeResolveRef.current) sizeResolveRef.current(imageSize);
    sizeResolveRef.current = null;
    setSizeDialog(null);
  };

  const handleSizeCancel = () => {
    if (sizeResolveRef.current) sizeResolveRef.current(null);
    sizeResolveRef.current = null;
    setSizeDialog(null);
  };

  const handleImageUpload = useCallback(async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      setUploading(true);
      setUploadStatus("이미지 업로드 중...");
      let url: string;
      try {
        url = await uploadImage(file);
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("이미지 업로드에 실패했습니다.");
        setUploading(false);
        setUploadStatus("");
        continue;
      }
      setUploading(false);
      setUploadStatus("");
      const altText = file.name === "image.png" ? "image" : file.name.replace(/\.[^.]+$/, "");
      const size = await openSizeDialog(url, altText);
      if (size === null) continue;
      if (size === "100%") {
        insertAtCursor(`\n![${altText}](${url})\n`);
      } else {
        insertAtCursor(`\n<img src="${url}" alt="${altText}" style="width: ${size}; max-width: 100%;" />\n`);
      }
    }
  }, [insertAtCursor, openSizeDialog]);

  const processHtmlPaste = useCallback(async (html: string) => {
    let markdown = turndown.turndown(html);

    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: { full: string; alt: string; url: string }[] = [];
    let match;
    while ((match = imgRegex.exec(markdown)) !== null) {
      images.push({ full: match[0], alt: match[1], url: match[2] });
    }

    if (images.length === 0) {
      insertAtCursor(markdown);
      return;
    }

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
          try {
            newUrl = await proxyUploadImage(img.url);
          } catch {
            newUrl = img.url;
          }
        } else {
          continue;
        }
        processed = processed.replace(img.url, newUrl);
      } catch (error) {
        console.error(`Failed to upload image ${i + 1}:`, error);
      }
    }

    setUploading(false);
    setUploadStatus("");
    insertAtCursor(processed);
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

    if (imageFiles.length > 0 && !html) {
      e.preventDefault();
      handleImageUpload(imageFiles);
      return;
    }

    if (html) {
      const hasRichContent = /<(h[1-6]|p|img|ul|ol|blockquote|hr|strong|em|table)/i.test(html);
      if (hasRichContent) {
        e.preventDefault();
        processHtmlPaste(html);
        return;
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      handleImageUpload(imageFiles);
      return;
    }
  }, [handleImageUpload, processHtmlPaste]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files);
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const toolbarButtons = [
    { icon: Bold, action: () => insertText("**", "**"), title: "굵게" },
    { icon: Italic, action: () => insertText("*", "*"), title: "기울임" },
    { icon: Heading1, action: () => insertText("\n## ", "\n"), title: "제목" },
    { icon: Heading2, action: () => insertText("\n### ", "\n"), title: "소제목" },
    { icon: Quote, action: () => insertText("\n> ", "\n"), title: "인용" },
    { icon: List, action: () => insertText("\n- ", "\n"), title: "목록" },
    { icon: ListOrdered, action: () => insertText("\n1. ", "\n"), title: "번호 목록" },
    { icon: Minus, action: () => insertText("\n---\n"), title: "구분선" },
    { icon: Link, action: () => insertText("[", "](url)"), title: "링크" },
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1 flex-1">
          {toolbarButtons.map(({ icon: Icon, action, title }) => (
            <button
              key={title}
              type="button"
              onClick={action}
              title={title}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="이미지 삽입"
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            disabled={uploading}
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
          />
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-colors ${
              mode === "write"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Edit2 className="h-3.5 w-3.5" />
            작성
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-colors ${
              mode === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            미리보기
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      {mode === "write" ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            placeholder={placeholder || "마크다운으로 작성하세요... 노션에서 바로 복사-붙여넣기하면 이미지 포함 자동 변환됩니다."}
            className="w-full min-h-[400px] px-4 py-3 bg-background text-foreground focus:outline-none resize-y font-mono text-sm leading-relaxed"
          />
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
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-muted-foreground text-sm">미리보기할 내용이 없습니다.</p>
          )}
        </div>
      )}

      {/* Image size dialog */}
      {sizeDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={handleSizeCancel}
        >
          <div
            className="bg-background border border-border rounded-xl p-6 w-[480px] max-w-[90vw] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-4">이미지 크기 설정</h3>
            <div className="mb-4 rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center h-[180px]">
              <img
                src={sizeDialog.url}
                alt={sizeDialog.alt}
                className="max-h-[180px] max-w-full object-contain"
              />
            </div>
            <div className="flex gap-2 mb-4">
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setImageSize(preset.value)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    imageSize === preset.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div>{preset.label}</div>
                  <div className="text-xs opacity-70">{preset.value}</div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-5">
              <label className="text-sm text-muted-foreground whitespace-nowrap">직접 입력</label>
              <input
                type="text"
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value)}
                placeholder="예: 400px, 60%"
                className="flex-1 px-3 py-1.5 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleSizeCancel}
                className="px-4 py-2 text-sm rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSizeConfirm}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                삽입
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
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
            const childArray = Array.isArray(children) ? children : [children];
            const imgChildren = childArray.filter(
              (child: any) => child?.type === "img" || child?.props?.node?.tagName === "img"
            );
            const nonEmptyChildren = childArray.filter(
              (child: any) => child !== "\n" && child !== " " && child !== ""
            );

            if (imgChildren.length >= 2 && imgChildren.length === nonEmptyChildren.length) {
              const cols = imgChildren.length === 2 ? "grid-cols-2"
                : imgChildren.length === 3 ? "grid-cols-3"
                : "grid-cols-2";
              return (
                <div className={`not-prose grid ${cols} gap-3 my-6`}>
                  {childArray.map((child: any, i: number) => {
                    if (child === "\n" || child === " " || child === "") return null;
                    return (
                      <div key={i} className="overflow-hidden rounded-lg">
                        {child}
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (imgChildren.length === 1 && imgChildren.length === nonEmptyChildren.length) {
              return <div className="my-6">{children}</div>;
            }

            return <p {...props}>{children}</p>;
          },
          img: ({ src, alt, style, ...props }) => {
            const customStyle = style as React.CSSProperties | undefined;
            const hasCustomWidth = customStyle?.width !== undefined;
            return (
              <img
                src={src}
                alt={alt || ""}
                loading="lazy"
                style={customStyle}
                className={`rounded-lg h-auto object-cover ${hasCustomWidth ? "max-w-full" : "w-full"}`}
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
