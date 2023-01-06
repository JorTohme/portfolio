import Image from 'next/image'
import { useRef } from 'react'
import { useInView } from 'framer-motion'

import { Albert_Sans } from '@next/font/google'
const albertSansBold = Albert_Sans({ weight: '700' })

export default function Technologies ({ theme }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  const slideIn = {
    transform: isInView ? 'none' : 'translateY(200px)',
    opacity: isInView ? 1 : 0,
    transition: 'all 1.5s ease'
  }

  return (
    <div id='technologies' className={`${theme.technologies} ${albertSansBold.className} technologies`}>
      <h2 className={`${theme.sectionTitle} sectionTitle`}>Tecnologías que uso</h2>

      <div className='technologiesContainer'>

        <div style={slideIn} className={`${theme.technology} technology`} ref={ref}>
          <Image src='/technologies/nextjs.svg' alt='Next.js' width={90} height={90} />
        </div>
        <div style={slideIn} className={`${theme.technology} technology`}>
          <Image src='/technologies/reactjs.svg' alt='React.js' width={80} height={80} />
        </div>
        <div style={slideIn} className={`${theme.technology} technology`}>
          <Image src='/technologies/reactnative.svg' alt='React Native' width={90} height={90} />
        </div>
        <div style={slideIn} className={`${theme.technology} technology`}>
          <Image src='/technologies/python.svg' alt='Python' width={80} height={80} />
        </div>
        <div style={slideIn} className={`${theme.technology} technology`}>
          <Image src='/technologies/mysql.svg' alt='MySQL' width={80} height={80} />
        </div>
        <div style={slideIn} className={`${theme.technology} technology`}>
          <Image src='/technologies/github.svg' alt='Git & Github' width={80} height={80} />
        </div>
        <div style={slideIn} className={`${theme.technology} technology`}>
          <Image src='/technologies/mongodb.svg' alt='MongoDB' width={80} height={80} />
        </div>
        <div style={slideIn} className={`${theme.technology} technology`}>
          <Image src='/technologies/js.svg' alt='JavaScript' width={80} height={80} />
        </div>
        <div style={slideIn} className={`${theme.technology} technology`}>
          <Image src='/technologies/html.svg' alt='HTML' width={80} height={80} />
        </div>
        <div style={slideIn} className={`${theme.technology} technology`}>
          <Image src='/technologies/css.svg' alt='CSS' width={80} height={80} />
        </div>
      </div>
    </div>
  )
}
