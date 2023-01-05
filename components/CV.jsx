import { Albert_Sans } from '@next/font/google'

const albertSansBold = Albert_Sans({ weight: '700' })

export default function Contact ({ theme }) {
  return (
    <div className={theme.cv} id='cv'>
      <div className={`${theme.sectionTitle} ${albertSansBold.className}`}>CV</div>
      <div className={theme.downloadContainer}>
        <a href='CV/JorgeTohme.pdf' download='JorgeTohme.pdf' className={`${theme.downloadCV} ${albertSansBold.className}`}>Descargar CV</a>
      </div>
    </div>
  )
}
