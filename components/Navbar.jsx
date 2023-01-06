import Link from 'next/link'

import { Poppins } from '@next/font/google'
const poppings = Poppins({ weight: '500' })

export default function Navbar ({ theme }) {
  return (
    <header className={`${theme.header} header`}>
      <nav className={`${theme.nav} nav ${poppings.className}`}>
        <ul className={`${theme.ul} ul`}>
          <li className={`${theme.li} li`}>
            <Link href='#projects'>Proyectos</Link>
          </li>
          <li className={`${theme.li} li`}>
            <Link href='#technologies'>Tecnologías</Link>
          </li>
          <li className={`${theme.li} li`}>
            <Link href='#contact'>Contacto</Link>
          </li>
          <li className={`${theme.li} li`}>
            <Link href='#cv'>CV</Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
