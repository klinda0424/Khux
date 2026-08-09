import { AccordionGallery } from "../components/accordion-gallery/AccordionGallery";
import { GALLERY_ITEMS } from "../data/gallery-items";

export function Gallery() {
  return (
    <div className="w-full py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl sm:text-5xl mb-4">Gallery</h1>
          <p className="text-lg text-muted-foreground">
            KHUX의 다양한 활동 현장을 사진으로 만나보세요.
          </p>
        </div>

        <AccordionGallery items={GALLERY_ITEMS} defaultIndex={1} height={640} expandRatio={0.4} />
      </div>
    </div>
  );
}
