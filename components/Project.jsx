import { useRef } from 'react'
import { useInView } from 'framer-motion'
import Image from 'next/image'

import { Albert_Sans } from '@next/font/google'
const albertSansBold = Albert_Sans({ weight: '700' })

export default function Project ({ theme, projectName, imageSrc, children }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <div ref={ref}>
      <div
        className={theme.project}
        style={{
          transform: isInView ? 'none' : 'translateX(-200px)',
          opacity: isInView ? 1 : 0,
          transition: 'all 1.2s ease'
        }}
      >
        <div className={theme.projectImageContainer}>
          <Image src={imageSrc} alt={projectName} className={theme.projectImage} fill />
        </div>
        <div className={theme.projectDataContainer}>
          <div className={`${theme.projectName} ${albertSansBold.className}`}> {projectName} </div>
          <div className={theme.projectDescription}>
            {children}
          </div>

        </div>
      </div>
    </div>
  )
}
