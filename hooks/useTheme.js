import light from '../styles/Themes/Light.module.css'
import dark from '../styles/Themes/Dark.module.css'
import { useState } from 'react'

export default function useTheme () {
  const [theme, setDarkMode] = useState(light)
  const [button, setButton] = useState('/moon.svg')

  const setTheme = () => {
    if (theme === light) {
      setButton('/sun.svg')
      setDarkMode(dark)
    } else {
      setButton('/moon.svg')
      setDarkMode(light)
    }
  }
  return { theme, setTheme, button }
}
