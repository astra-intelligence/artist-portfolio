"use client";

/*
 * The painting on /work/<slug>, plus the two things that need the browser:
 * clicking the image opens it full screen (a "lightbox"), and the left/right
 * arrow keys go to the previous/next painting. The page itself stays a
 * Server Component and passes the hrefs in as props.
 *
 * The lightbox shows the same watermarked preview file as the page, only
 * drawn larger, so it exposes nothing new.
 */
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  title: string;
  image: string;
  alt: string;
  width: number;
  height: number;
  previousHref?: string;
  nextHref?: string;
};

// True when a key press belongs to something the visitor is typing into.
function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function PaintingViewer({ title, image, alt, width, height, previousHref, nextHref }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // useEffect runs after the component is on screen. The function it returns
  // is the cleanup (think destructor): it removes the listener when the page
  // goes away or the hrefs change, so listeners never pile up.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Leave the arrows alone while the lightbox is open, when a modifier is
      // held (browser shortcuts like Alt+Left = back), or while typing.
      if (open || event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isTyping(event.target)) return;
      const href = event.key === "ArrowLeft" ? previousHref : event.key === "ArrowRight" ? nextHref : undefined;
      if (!href) return;
      event.preventDefault();
      router.push(href);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, previousHref, nextHref, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <figure>
        <DialogTrigger
          className="block w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          aria-label={`View ${title} larger`}
        >
          <Image
            src={image}
            alt={alt}
            width={width}
            height={height}
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="h-auto w-full border border-border bg-card"
          />
        </DialogTrigger>
      </figure>
      {/* cn() inside DialogContent lets these classes replace its small,
          centred card defaults with a full-screen dark panel. A click
          anywhere on it closes it again, as does Escape or the X button. */}
      <DialogContent
        onClick={() => setOpen(false)}
        className="flex h-dvh w-screen max-w-none cursor-zoom-out items-center justify-center rounded-none bg-black/95 p-4 text-white ring-0 sm:max-w-none sm:p-8"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <Image
          src={image}
          alt={alt}
          width={width}
          height={height}
          sizes="100vw"
          // Fill the panel and let object-contain scale the painting to fit,
          // keeping its proportions. Sizing it from the file instead would go
          // wrong: the image loader serves one file for every srcset width.
          className="h-full w-full object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
