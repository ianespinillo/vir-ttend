# Blog de novedades

Cada archivo `.md` de esta carpeta es una entrada de `/blog`. Publicar una novedad es agregar un archivo y hacer commit: el sitio se reconstruye y la entrada aparece en el listado, en el sitemap y en el RSS (`/blog/rss.xml`). Este `README.md` no se publica.

## Cómo publicar

1. Crear `content/blog/<slug>.md`. El nombre del archivo es la URL (`/blog/<slug>`): minúsculas, sin espacios. Para una versión, `version-1-4-0.md`.
2. Empezar con este bloque (`title`, `date` y `summary` son obligatorios; `version` y `tags` son opcionales. Si falta un campo obligatorio, el build falla indicando el archivo):

   ```md
   ---
   title: "Versión 1.4.0 · Lo nuevo en Vir-ttend"
   date: 2026-11-02
   version: 1.4.0
   summary: "Una o dos frases para el listado y las vistas previas al compartir."
   tags: [asistencia, app móvil]
   ---
   ```

   Poner `title` y `summary` entre comillas dobles: si el texto contiene `:` y no está entre comillas, el frontmatter (YAML) es inválido. `date` usa el formato `YYYY-MM-DD` y define el orden (la más nueva primero).

3. Escribir el cuerpo en Markdown con `##` para las secciones (el título ya es el `h1`). Redactar por beneficio para el usuario (directivos y personal escolar), no por detalle técnico.
4. Probar con `pnpm --filter site dev` (http://localhost:3002/blog) y hacer commit con un mensaje tipo `docs(site): publish release notes 1.4.0`.

## Reglas del Markdown

- Se admite Markdown estándar (incluidas las listas y tablas de GitHub).
- El HTML crudo se escapa (se muestra como texto, no se ejecuta). Los enlaces solo pueden ser `http(s)`, `mailto`, rutas del sitio o anclas.
- Las imágenes todavía no están contempladas; si se necesitan, ponerlas en `public/blog/` y referenciarlas como `/blog/archivo.png`.
