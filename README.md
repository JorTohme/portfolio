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
| `dist/voxel-models.js` | Paleta y modelos compartidos por la portada y el juego: el muñequito y el árbol |
| `dist/juego.html` | Página del minijuego: interfaz, paleta de bloques y estilos propios |
| `dist/game/grid.js` | Grilla de voxels, recorrido de rayos y códecs de guardado y compartir |
| `dist/game/island.js` | La isla dibujada sobre la grilla: terreno, camino, casa, grúa y árboles |
| `dist/game/world.js` | Dibujado de la grilla con `InstancedMesh`, un mesh por color |
| `dist/game/player.js` | Física del muñequito: gravedad, colisiones y escalón automático |
| `dist/game/game.js` | Escena, cámara, controles, interfaz y los extras del juego |
| `dist/three.module.js` | Three.js r170, dependencia incluida con licencia MIT |
| `dist/i18n.js` | Motor de traducción: reemplaza textos y atributos según el diccionario |
| `dist/i18n/en.js` | Toda la copia en inglés, una clave por elemento |
| `dist/en/index.html` | Portada en inglés |
| `dist/en/juego.html` | Juego en inglés |

## Los dos idiomas

El español es la única versión que se escribe a mano. Cada elemento traducible lleva un `data-i18n` y el diccionario guarda su HTML, así un título como `Nada aparece<br>de la nada.` es una sola clave y el inglés puede cortar la línea donde le quede mejor. Los atributos viajan en `data-i18n-attr`, con la forma `atributo@clave`.

Las páginas de `dist/en/` no duplican el markup: bajan el HTML español, lo traducen en un documento aparte y recién entonces lo insertan, de modo que nunca se pinta una palabra en español antes del cambio.

**Para cambiar un texto**: editalo en `dist/index.html` y actualizá su clave en `dist/i18n/en.js`. Si te olvidás del inglés, esa parte queda en español y la consola del navegador avisa cuántas claves faltan.

Los pocos textos que viven en JavaScript usan el mismo diccionario a través de una global que solo existe en las páginas en inglés, con el español como valor por omisión.

Para verificar que no falte ninguna traducción:

```sh
node qa/i18n-check.mjs
```

## Analíticas

Las cuatro páginas cargan el script de Vercel Web Analytics desde el `<head>`, con `defer`. Va en el encabezado y no en el cuerpo porque las páginas de `dist/en/` reemplazan el `<body>` entero al armarse, y se llevarían puesto cualquier script que estuviera ahí.

El script solo existe en los dominios de Vercel: fuera de ahí devuelve 404 y no pasa nada. Para que empiece a registrar visitas hay que habilitar **Web Analytics** en el panel del proyecto, en Analytics; el código por sí solo no alcanza.

## El minijuego

Al pasar el cursor sobre la escena 3D aparece un botón **Jugar**; en celular queda fijo abajo a la derecha. Lleva a `juego.html`, un sandbox de voxels sobre la misma isla, con el mismo muñequito de la portada.

La isla del juego está redibujada sobre una grilla uniforme de celdas de 0,72 unidades, el mismo paso que usa la portada. La escena de `main.js` no sirve para esto: sus bloques tienen tamaños distintos entre sí porque es una composición hecha a mano, no una grilla.

En computadora se camina con WASD, se salta con espacio, se pone un bloque con click y se saca con click derecho. En celular se toca el piso para caminar hasta ahí y el botón 🚶 / ⛏ cambia entre caminar y construir. Arrastrar gira la cámara; la rueda o el pellizco acercan.

Lo que construís se guarda solo en el navegador. **Compartir** copia un link que lleva tu isla comprimida adentro, **Descargar imagen** baja una captura y **Volver al original** borra todo y reconstruye la isla inicial.

## Revisar la lógica del juego

```sh
node qa/selftest.mjs
```

Corre sin navegador y sin dependencias. Verifica el recorrido de rayos, la oclusión de caras, los códecs de guardado y compartir, la física del muñequito y que la isla sea jugable.

**En este proyecto `dist/` contiene el código fuente editable, no una carpeta descartable generada por un build. No la borres.** No hace falta compilar.

`vercel.json` le dice a Vercel exactamente eso: framework `null`, comando de build vacío y carpeta a publicar `dist`. Sin ese archivo, Vercel detecta Vite en el `package.json` e inventa un build que este proyecto no tiene.

**No corras `vite build`.** No da error, pero tomaría solo `index.html` como entrada y dejaría afuera `juego.html` y las dos páginas de `dist/en/`, así que produciría un sitio incompleto. Su salida cae en `dist/dist/`, que está ignorada.

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
