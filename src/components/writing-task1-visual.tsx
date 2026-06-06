import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface WritingTask1VisualProps {
  readonly imageUrl: string
  readonly imageAlt: string
  readonly resetTransformKey: string
}

export function WritingTask1Visual({
  imageUrl,
  imageAlt,
  resetTransformKey,
}: WritingTask1VisualProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <figure className="mt-2 md:mt-4 overflow-hidden rounded-sm border bg-muted">
        <button
          type="button"
          className="hover:bg-muted/80 focus-visible:ring-ring w-full cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={() => {
            setOpen(true)
          }}
          aria-label="Open chart full screen: pinch to zoom and drag to pan"
        >
          <img
            src={imageUrl}
            alt={imageAlt}
            className="mx-auto max-h-[min(28rem,55vh)] w-full object-contain"
          />
        </button>
      </figure>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/90" />
          <DialogPrimitive.Content
            className={cn('fixed inset-0 z-50 flex flex-col bg-zinc-950 outline-none')}
          >
            <DialogPrimitive.Close
              type="button"
              className="ring-offset-background hover:bg-white/10 focus-visible:ring-ring absolute top-3 right-3 z-60 cursor-pointer rounded-sm bg-black/55 p-2.5 text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              aria-label="Close full screen chart"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>

            <DialogTitle className="sr-only">Task 1 chart — zoom and pan</DialogTitle>
            <DialogDescription className="sr-only">
              Pinch with two fingers to zoom. Drag to pan. Double-tap to reset zoom. Use the close
              control or Escape to exit.
            </DialogDescription>

            <div className="flex min-h-0 flex-1 flex-col px-2 pt-14 pb-4">
              <TransformWrapper
                key={`${resetTransformKey}-${String(open)}`}
                initialScale={1}
                minScale={0.5}
                maxScale={6}
                centerOnInit
                limitToBounds={false}
                panning={{ velocityDisabled: false }}
                pinch={{ step: 8, disabled: false }}
                doubleClick={{ mode: 'reset', animationTime: 200 }}
                wheel={{ step: 0.12, disabled: false }}
              >
                <TransformComponent
                  wrapperClass="!h-[min(88dvh,calc(100dvh-4rem))] !w-full max-h-full cursor-grab active:cursor-grabbing"
                  contentClass="!flex !h-full !w-full items-center justify-center"
                >
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    className="max-h-[min(88dvh,calc(100dvh-4rem))] max-w-[100vw] select-none object-contain"
                    draggable={false}
                  />
                </TransformComponent>
              </TransformWrapper>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  )
}
