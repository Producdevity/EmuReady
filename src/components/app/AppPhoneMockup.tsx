'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { memo, useEffect, useMemo, useState } from 'react'
import { motionPresets } from '@/lib/motionPresets'
import { cn } from '@/lib/utils'
import { ms } from '@/utils/time'

interface Props {
  alt: string
  imageSrcs: string[]
  className?: string
}

function BaseAppPhoneMockup(props: Props) {
  const slides = useMemo(() => props.imageSrcs.filter((src) => Boolean(src)), [props.imageSrcs])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return

    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, ms.seconds(10))

    return () => window.clearInterval(id)
  }, [slides.length])

  return (
    <motion.div
      className={cn('relative mx-auto flex w-full max-w-sm justify-center', props.className)}
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 mx-auto w-full max-w-sm rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/20" />
      <motion.div {...motionPresets.fadeInUp(0.05)} className="relative w-full max-w-[19rem]">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[3rem] bg-gradient-to-br from-emerald-400/25 via-blue-500/20 to-purple-500/25 blur-2xl" />
        <div className="relative overflow-hidden rounded-[2.7rem] border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 shadow-[0_45px_120px_-45px_rgba(59,130,246,0.55)] dark:border-gray-700/70">
          <div className="flex justify-between px-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-white/50">
            <span>EmuReady</span>
            <span>Android App</span>
          </div>

          <div className="relative mt-4 aspect-[9/16.2] overflow-hidden rounded-[1.6rem] border border-white/12 bg-black">
            <AnimatePresence mode="wait">
              <motion.div
                key={slides[activeIndex]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                <Image
                  src={slides[activeIndex]}
                  alt={props.alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 19rem, 60vw"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export const AppPhoneMockup = memo(BaseAppPhoneMockup)
