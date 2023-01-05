import Image from 'next/image'
import { Albert_Sans } from '@next/font/google'

const albertSansBold = Albert_Sans({ weight: '700' })
const albertSansLight = Albert_Sans({ weight: '300' })

export default function Contact ({ theme }) {
  return (
    <div className={`${theme.contact} ${albertSansBold.className}`} id='contact'>
      <div className={`${theme.sectionTitle} ${albertSansBold.className}`}>Contacto</div>
      <div className={`${theme.hola} ${albertSansLight.className}`}>
        <form>
          <label htmlFor='name'>Nombre </label>
          <input type='text' placeholder='Nombre' id='name' autoComplete='no' />
          <label htmlFor='email'>Email </label>
          <input type='email' placeholder='Email' id='email' autoComplete='no' />
          <label htmlFor='message'>Mensaje </label>
          <textarea placeholder='Mensaje' id='message' />
          <button type='submit'>Enviar</button>
        </form>
        <div className={theme.social}>
          O contáctame por mis redes:
          <div>
            <a href='https://www.linkedin.com/in/jorgetohme/' target='_blank' rel='noreferrer'>
              <Image src='/social/linkedin.svg' alt='linkedin' width={40} height={40} />
            </a>
            <a href='https://github.com/JorTohme' target='_blank' rel='noreferrer'>
              <Image src='/social/github.svg' alt='github' width={40} height={40} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
