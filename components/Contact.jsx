import Image from 'next/image'
import emailJS from 'emailjs-com'
import { useState } from 'react'
import { Snackbar, SnackbarContent } from '@mui/material'
import { Albert_Sans } from '@next/font/google'
import { textAlign } from '@mui/system'

const albertSansBold = Albert_Sans({ weight: '700' })
const albertSansLight = Albert_Sans({ weight: '300' })

export default function Contact ({ theme }) {
  const [openSnackBar, setSnackBar] = useState(false)

  function handleSubmit (e) {
    event.preventDefault()
    Array.from(document.querySelectorAll('input')).forEach(input => (input.value = ''))
    Array.from(document.querySelectorAll('textarea')).forEach(input => (input.value = ''))

    emailJS.init('3PLy86Z4Yf6VzDNPV')
    emailJS.sendForm('service_t7w4ejr', 'template_nhhu5ve', '#form').then(res => {
      setSnackBar(true)
    }).catch(err => {
      console.log(err)
    })
  }

  return (
    <div className={`${theme.contact} ${albertSansBold.className}`} id='contact'>
      <div className={`${theme.sectionTitle} ${albertSansBold.className}`}>Contacto</div>
      <div className={`${theme.hola} ${albertSansLight.className}`}>
        <form onSubmit={handleSubmit} id='form'>
          <label htmlFor='name'>Nombre </label>
          <input type='text' placeholder='Nombre' id='name' name='name' autoComplete='no' required />
          <label htmlFor='email'>Email </label>
          <input type='email' placeholder='Email' id='email' name='email' autoComplete='no' required />
          <label htmlFor='message'>Mensaje </label>
          <textarea placeholder='Mensaje' id='message' name='message' required />
          <button type='submit'>Enviar</button>
          <Snackbar
            open={openSnackBar}
            autoHideDuration={3000}
            onClose={() => setSnackBar(false)}
          >
            <SnackbarContent
              style={{
                backgroundColor: 'green',
                width: '50px',
                fontSize: '0.6rem',
                textAlign: 'center'
              }}
              message={<span id='client-snackbar'>¡Mensaje enviado!</span>}
            />
          </Snackbar>
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
