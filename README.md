# Jorge Tohmé — Siempre en construcción

Portafolio narrativo en español, con paleta verde, fondos voxel y una isla 3D que se construye mientras recorrés la carrera. HTML, CSS y JavaScript. No requiere backend ni un servicio de esta plataforma para funcionar.

## Abrir y editar en tu computadora

1. Descomprimí el ZIP y abrí la carpeta `jorge-portfolio` en tu editor (por ejemplo, VS Code).
2. Con Node.js 20 o superior instalado, abrí una terminal en esa carpeta y ejecutá:

```sh
npm ci
npm run dev
```

3. Abrí la dirección local que muestra la terminal. Los cambios se actualizan al guardar.

Usá el servidor local: abrir `index.html` con doble clic puede bloquear los módulos JavaScript por las restricciones del navegador.

## Qué editar

| Archivo | Contenido |
| --- | --- |
| `dist/index.html` | Textos, capítulos, estudios, habilidades y enlaces de contacto |
| `dist/style.css` | Paleta, tipografías, tamaños, composición y responsive |
| `dist/main.js` | Mundo voxel, recorrido de cámara, etapas e interacciones |
| `dist/assets/` | Fondos voxel WebP; versiones grandes y livianas para celular |
| `dist/voxel-renderer.js` | Renderizado alternativo cuando WebGL no está disponible |
| `dist/three.module.js` | Three.js r170, dependencia incluida con licencia MIT |

**En este proyecto `dist/` contiene el código fuente editable, no una carpeta descartable generada por un build. No la borres.** No hace falta compilar.

El scroll es nativo. La cámara orbita, cambia de altura y acerca la escena; los fondos acompañan el recorrido con un movimiento suave. En celular se muestra la escena dentro de cada capítulo. El control de pausa y la preferencia del sistema de reducir movimiento detienen las animaciones.

Los textos parten del CV; revisá las fechas, los estudios en curso y los enlaces antes de publicar. Las fuentes se solicitan a Google Fonts; si no hay conexión, se usan fuentes del sistema. Los modelos, scripts e imágenes se sirven localmente.

## Subirlo a tu propio repositorio

Creá un repositorio vacío en el proveedor que uses. Luego, desde la carpeta del proyecto:

```sh
git init -b main
git add .
git commit -m "Agregar portafolio voxel"
git remote add origin URL_DE_TU_REPOSITORIO
git push -u origin main
```

Reemplazá `URL_DE_TU_REPOSITORIO` por la URL que te da tu proveedor. Si ya tenés un repo con trabajo, copiá estos archivos dentro y revisá los cambios antes de confirmar. `node_modules/` está excluido de Git; las dependencias se reinstalan con `npm ci`.

## Publicarlo fuera de esta plataforma

Es un sitio estático: configurá la carpeta de publicación como `dist`, sin comando de build. Si tu hosting acepta una carpeta para subir, subí el contenido completo de `dist/`, conservando las rutas de los archivos y la carpeta `assets/`.

No requiere variables de entorno, claves ni API. La configuración privada del Site original y su historial Git no forman parte del ZIP.

## Revisar el responsive

Con el servidor local abierto, agregá `/__responsive` a su dirección para revisar anchos de 320, 390, 768 y 1440 px y texto al 200%. Esta página está en `qa/responsive.html` y se sirve solamente durante desarrollo. También conviene probarlo en tu propio celular y navegador.

## Dependencias y recursos

- Three.js r170: licencia MIT en `dist/THREE-LICENSE.txt`. Conservá este archivo al redistribuir la dependencia.
- Vite: servidor de desarrollo, instalado mediante `package-lock.json`.
- Los dos fondos voxel fueron generados para este portafolio y están incluidos en WebP.
