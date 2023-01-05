import Head from 'next/head'
import Image from 'next/image'
// Hooks
import useTheme from '../hooks/useTheme'

// Components
import Navbar from '../components/Navbar'
import Projects from '../components/Projects'
import Technologies from '../components/Technologies'
import Contact from '../components/Contact'
import Cv from '../components/CV'

import { Albert_Sans, Sora } from '@next/font/google'
const albertSans = Albert_Sans()
const sora = Sora()

export default function Home () {
  const { theme, setTheme, button } = useTheme()
  return (
    <>
      <Head>
        <title>Jorge</title>
        <meta name='description' content='Jorge personal portfolio' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main>
        <button className={`themeButton ${theme.themeButton}`} onClick={setTheme}><Image src={button} alt='' width={34} height={34} /></button>
        <Navbar theme={theme} projects='projects' />
        <div className={`presentation ${theme.presentation}`}>
          <div className='photoContainer'>
            <Image className={`photo ${theme.photo}`} src='/jorge.JPEG' alt='Una foto de mi' fill priority />
          </div>
          <div className='aboutMe--Container'>
            <h1 className={`${albertSans.className} ${theme.h1}`}>Jorge L. Tohmé</h1>
            <h2 className={`${albertSans.className} ${theme.h2}`}>Full Stack developer</h2>
            <p className={`${sora.className} aboutMe ${theme.aboutMe}`}>
              ¡Hola! Me llamo Jorge. Soy de <span>Mendoza, Argentina</span> y soy estudiante de la carrera de
              <span> Licenciatura de Informática y Desarrollo de Software </span>en Universidad del Aconcagua. También estoy aprendiendo Data Analysis.
              Me interesan otras herramientas que no son de programación como Illustrator, Photoshop, After Effects, etc.
            </p>
          </div>

        </div>

        <Projects theme={theme} />
        <Technologies theme={theme} />
        <div className={theme.background}>
          <Contact theme={theme} />
          <Cv theme={theme} />
        </div>

      </main>
    </>
  )
}
