Guía Maestra de Desarrollo y Lanzamiento de Proyectos Web (React + Vite)

Este documento sirve como un "Canvas Didáctico" para guiarte paso a paso desde una idea hasta un producto en línea (MPV), utilizando herramientas modernas y gratuitas.

📋 Fase 1: Preparación del Entorno (Solo se hace una vez al inicio)

Antes de empezar cualquier proyecto, asegúrate de tener las herramientas básicas instaladas en tu computadora.

Instalar Node.js:

Descarga e instala la versión LTS desde nodejs.org.

Verifica en tu terminal con: node -v y npm -v.

Instalar Git:

Descarga e instala desde git-scm.com.

Configura tu identidad (una sola vez):

git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"


Cuenta en GitHub: Crea una cuenta gratuita en github.com.

Cuenta en Netlify: Crea una cuenta gratuita en netlify.com y vincúlala con tu GitHub.

🛠️ Fase 2: Creación del Proyecto (El "Andamiaje")

Aquí es donde nace tu aplicación. Usaremos Vite por su velocidad y simplicidad.

Paso 2.1: Generar la estructura base

Abre tu terminal en la carpeta donde guardas tus proyectos y ejecuta:

npm create vite@latest nombre-de-tu-proyecto -- --template react


(Esto crea una carpeta con todo lo necesario para React).

Paso 2.2: Instalar dependencias iniciales

Entra a la carpeta y descarga las librerías base:

cd nombre-de-tu-proyecto
npm install


Paso 2.3: Instalar librerías específicas (Según tu idea)

Para este editor Markdown, usamos:

npm install marked highlight.js @uiw/react-codemirror @codemirror/lang-markdown @codemirror/theme-one-dark @codemirror/view


(Adapta este paso a las necesidades de tu futuro proyecto).

Paso 2.4: Limpieza inicial

Borra el contenido de src/index.css (para evitar estilos que limiten el ancho).

Limpia src/App.css y src/App.jsx para empezar de cero o pega tu código base.

💻 Fase 3: Desarrollo y Pruebas (El "Ciclo Creativo")

Trabaja en tu computadora localmente.

Iniciar el servidor de desarrollo:

npm run dev


Abre el link que te da (ej: http://localhost:5173) en tu navegador.

Editar código: Modifica App.jsx y App.css. Los cambios se verán al instante.

Iterar: Prueba, rompe, arregla y mejora hasta que tengas tu MPV (Producto Mínimo Viable).

☁️ Fase 4: Control de Versiones (Guardar en Git)

Una vez que tu MPV funciona localmente, es hora de guardarlo en el historial y prepararlo para la nube.

Paso 4.1: Inicializar el repositorio local

git init
git branch -m main  # Asegura que la rama se llame 'main'


Paso 4.2: Guardar los cambios

git add .
git commit -m "Versión inicial del MPV lista"


Paso 4.3: Conectar con GitHub

Crea un nuevo repositorio vacío en GitHub (sin README).

Copia la URL HTTPS del repositorio.

En tu terminal:

git remote add origin [https://github.com/TU-USUARIO/TU-REPO.git](https://github.com/TU-USUARIO/TU-REPO.git)
git push -u origin main


(Si te pide contraseña, usa tu Token de Acceso Personal de GitHub, no tu contraseña de login).

🚀 Fase 5: Despliegue en Producción (Lanzamiento)

Hacer que tu proyecto sea accesible para todo el mundo.

Paso 5.1: Configurar Netlify

Entra a Netlify y haz clic en "Add new site" -> "Import an existing project".

Selecciona GitHub.

Busca y selecciona tu repositorio (nombre-de-tu-proyecto).

Paso 5.2: Configuración de Build (CRÍTICO)

Asegúrate de que estos campos estén correctos para un proyecto Vite:

Build command: npm run build

Publish directory: dist

Paso 5.3: Desplegar

Haz clic en "Deploy site". Netlify construirá tu proyecto y te dará una URL pública.

🔄 Fase 6: Mantenimiento y Actualizaciones

¿Quieres cambiar algo o arreglar un error después de lanzar?

Edita los archivos en tu computadora.

Prueba localmente (npm run dev).

Guarda y sube los cambios:

git add .
git commit -m "Descripción de lo que cambiaste"
git push


¡Listo! Netlify detectará el git push y actualizará tu sitio web automáticamente en segundos.

💡 Resumen de Comandos Esenciales

Acción

Comando

Crear proyecto

npm create vite@latest

Instalar librerías

npm install nombre-libreria

Correr servidor local

npm run dev

Generar versión final

npm run build

Guardar cambios (Git)

git add . → git commit -m "mensaje"

Subir a la nube (Git)

git push

📝 Notas Adicionales para Futuros Proyectos

Errores de Build: Si Netlify falla, revisa los logs. A veces falta una librería en package.json (como nos pasó con glob).

Estilos: Recuerda siempre limpiar los estilos por defecto de Vite (index.css) si quieres control total del diseño.

Tokens: Guarda tu Token de GitHub en un lugar seguro (como un gestor de contraseñas), lo necesitarás cada vez que conectes un proyecto nuevo.