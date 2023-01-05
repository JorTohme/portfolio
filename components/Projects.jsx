import Project from './Project'

import { Albert_Sans } from '@next/font/google'
const albertSansBold = Albert_Sans({ weight: '700' })
const albertSansLight = Albert_Sans({ weight: '300' })

export default function Projects ({ theme }) {
  return (
    <div className={`${albertSansBold.className} ${theme.projects}`} id='projects'>
      <h2 className={theme.sectionTitle}>Proyectos</h2>

      <div className={`${albertSansLight.className} ${theme.projectsContainer}`}>

        <div className={theme.projectLeft}>
          <Project theme={theme} projectName='Marflix' imageSrc='/projects/marflix.png'>
            Clon funcional de Netflix programado en Next.js en el front y con una API en Express.js en el brackend
            que entrega la información de los videos.
            Sigue en progreso.
          </Project>
        </div>

        <div className={theme.projectRight}>
          <Project theme={theme} projectName='Pokedex' imageSrc='/projects/pokedex.png'>
            Pokedex programada en React.js que consume la API de PokeAPI. Imita la Pokedex de los juegos de Pokémon, al ingresar
            el nombre de un Pokémon, se muestra su imagen, sus estadísticas y sus ataques. <br /> <br />
            Es totalmente responsiva para usar en celulares.
          </Project>
        </div>

        <div className={theme.projectLeft}>
          <Project theme={theme} projectName='Sistema de Gestión Clínica' imageSrc='/projects/gestionclinica.png'>
            Un sistema de gestión clínica hecho para la tesis del Dr. Ramón Moreno de la UDA. En la tesis se expone el problema
            de que el control de niños recién nacidos se hace sobre soporte papel aún hoy. Esta página digitaliza todo el proceso.
            Está desarrollada en PHP y la base de datos se sostiene en mySQL. Está lista para usarse en cualquier clínica.
          </Project>
        </div>

      </div>

      <div className={`${theme.otherProjects} ${albertSansLight.className}`}>
        Constantemente estoy empezando nuevos proyectos, ya sean de la facultad o personales a todos los voy subiendo a mi Github.
        Puedes ver en que estoy trabajando en mi perfil de Github. <br /> <br />
        <a href='https://github.com/JorTohme' target='_blank' rel='noreferrer'>Ir a Github</a>
      </div>

    </div>
  )
}
