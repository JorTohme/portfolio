import Project from './Project'

import { Albert_Sans } from '@next/font/google'
const albertSansBold = Albert_Sans({ weight: '700' })
const albertSansLight = Albert_Sans({ weight: '300' })

export default function Projects ({ theme }) {
  return (
    <div className={`${albertSansBold.className} ${theme.projects} projects`} id='projects'>
      <h2 className={`${theme.sectionTitle} sectionTitle`}>Proyectos</h2>

      <div className={`${albertSansLight.className} projectsContainer`}>

        <div className='projectLeft'>
          <Project theme={theme} projectName='Codeshow' imageSrc='/projects/codeshow.png'>
            Codeshow es una app web inspirada en <a href='https://codepen.io/' target='_blank' rel='noreferrer'>Codepen</a> donde se puede codear en la web. <br /> <br />
            La página tiene 3 secciones de código (una de HTML, una de CSS y una de JS) y un espacio para ver el resultado de la combinación de los 3.
          </Project>
        </div>

        <div className='projectRight'>
          <Project theme={theme} projectName='Pokedex' imageSrc='/projects/pokedex.png'>
            Pokedex programada en React.js que consume la API de PokeAPI. Imita la Pokedex de los juegos de Pokémon, al ingresar
            el nombre de un Pokémon, se muestra su imagen, sus estadísticas y sus ataques. <br /> <br />
            Es totalmente responsiva para usar en celulares.
          </Project>
        </div>

        <div className='projectLeft'>
          <Project theme={theme} projectName='Sistema de Gestión Clínica' imageSrc='/projects/gestionclinica.png'>
            Un sistema de gestión clínica hecho para la tesis del Dr. Ramón Moreno de la UDA. En la tesis se expone el problema
            de que el control de niños recién nacidos se hace sobre soporte papel aún hoy. Esta página digitaliza todo el proceso.
            Está desarrollada en PHP y la base de datos se sostiene en mySQL. Está lista para usarse en cualquier clínica.
          </Project>
        </div>

      </div>

      <div className={`${theme.otherProjects} ${albertSansLight.className} otherProjects`}>
        Constantemente estoy empezando nuevos proyectos, ya sean de la facultad o personales a todos los voy subiendo a mi Github.
        Puedes ver en que estoy trabajando en mi perfil de Github. <br /> <br />
        <a href='https://github.com/JorTohme' target='_blank' rel='noreferrer'>Ir a Github</a>
      </div>

    </div>
  )
}
