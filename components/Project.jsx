import { useRef } from 'react'
import { useInView } from 'framer-motion'
import Image from 'next/image'

import { Albert_Sans } from '@next/font/google'
const albertSansBold = Albert_Sans({ weight: '700' })

export default function Project ({ theme, projectName, imageSrc, projectLink, projectRepo, children }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <div ref={ref}>
      <div
        className={`${theme.project}`}
        style={{
          transform: isInView ? 'none' : 'translateX(-200px)',
          opacity: isInView ? 1 : 0,
          transition: 'all 1.2s ease'
        }}
      >
        <div className='project'>
          <div className='projectImageContainer'>
            <Image src={imageSrc} alt={projectName} className='projectImage' fill />
          </div>
          <div className='projectDataContainer'>
            <div className={`${theme.projectName} ${albertSansBold.className} projectName`}> {projectName} </div>
            <div className={`${theme.projectDescription} projectDescription`}>
              {children}
            </div>
          </div>
        </div>

        <div className='projectLinks'>
          <a href={projectLink} target='_blank' rel='noreferrer'>Ver web -</a>
          <a href={projectRepo} target='_blank' rel='noreferrer'> Ver código</a>
        </div>
      </div>
    </div>
  )
}
