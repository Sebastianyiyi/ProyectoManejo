# 🤝 Guía de contribución — BusEcuador

Gracias por querer contribuir al proyecto. Este documento describe los estándares y el flujo de trabajo que seguimos para mantener el código ordenado y el historial de cambios limpio.

---

## 📋 Tabla de contenidos

1. [Requisitos previos](#requisitos-previos)
2. [Configuración del entorno](#configuración-del-entorno)
3. [Flujo de trabajo Git Flow](#flujo-de-trabajo-git-flow)
4. [Convención de nombres de ramas](#convención-de-nombres-de-ramas)
5. [Commits convencionales](#commits-convencionales)
6. [Pull Requests](#pull-requests)
7. [Estándares de código](#estándares-de-código)
8. [Reporte de bugs](#reporte-de-bugs)
9. [Solicitud de cambios](#solicitud-de-cambios)

---

## Requisitos previos

- Node.js 20+
- npm 10+
- Docker (para pruebas de despliegue)
- Git configurado con tu nombre y correo

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@correo.com"
```

---

## Configuración del entorno

```bash
git clone https://github.com/tu-usuario/ProyectoManejo.git
cd ProyectoManejo
npm install
cp .env.example .env
# Completar .env con las credenciales de Supabase (solicitar al equipo)
npm run dev
```

---

## Flujo de trabajo Git Flow

Este proyecto sigue **Git Flow**. Las ramas principales son:

| Rama | Propósito |
|---|---|
| `main` | Código en producción. Solo recibe merges de `release/*` y `hotfix/*` |
| `develop` | Base de integración. Toda funcionalidad nueva parte de aquí |

### Crear una feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-descriptivo

# ... desarrollo ...

git add .
git commit -m "feat(modulo): descripción del cambio"
git push origin feature/nombre-descriptivo
# Abrir Pull Request hacia develop
```

### Crear una release

```bash
git checkout develop
git pull origin develop
git checkout -b release/X.Y.Z

# Ajustes finales, bump de versión, etc.
git commit -m "chore(release): preparar versión X.Y.Z"

# Merge a main
git checkout main
git merge --no-ff release/X.Y.Z -m "chore(release): merge release/X.Y.Z into main"
git tag -a vX.Y.Z -m "Release X.Y.Z"
git push origin main --tags

# Sync a develop
git checkout develop
git merge --no-ff release/X.Y.Z -m "chore(release): merge release/X.Y.Z back into develop"
git push origin develop

# Eliminar rama
git branch -d release/X.Y.Z
git push origin --delete release/X.Y.Z
```

### Hotfix en producción

```bash
git checkout main
git pull origin main
git checkout -b hotfix/descripcion-breve

# ... corrección ...
git commit -m "fix(modulo): descripción del fix"

git checkout main
git merge --no-ff hotfix/descripcion-breve
git tag -a vX.Y.Z+1 -m "Hotfix X.Y.Z+1"
git push origin main --tags

git checkout develop
git merge --no-ff hotfix/descripcion-breve
git push origin develop

git branch -d hotfix/descripcion-breve
```

---

## Convención de nombres de ramas

```
feature/nombre-en-kebab-case     # nueva funcionalidad
fix/descripcion-del-bug          # corrección en develop
release/X.Y.Z                    # preparación de versión
hotfix/descripcion-urgente       # fix en producción
chore/tarea-tecnica              # configuración, deps, refactor
```

---

## Commits convencionales

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<ámbito>): <descripción corta en minúsculas>
```

### Tipos permitidos

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `chore` | Tareas técnicas, dependencias, configuración |
| `refactor` | Cambio de código sin nueva funcionalidad ni fix |
| `style` | Cambios de formato, espaciado (sin lógica) |
| `docs` | Documentación únicamente |
| `test` | Agregar o corregir pruebas |
| `perf` | Mejora de rendimiento |

### Ejemplos

```bash
feat(boletos): agregar descuento para tercera edad
fix(auth): corregir redirección al cerrar sesión en móvil
chore(docker): agregar healthcheck al contenedor nginx
docs(readme): actualizar instrucciones de despliegue
refactor(rutasService): simplificar lógica de filtrado
```

---

## Pull Requests

- El PR siempre apunta a `develop` (o a `main` si es un hotfix/release).
- El título sigue el formato de commit convencional.
- Completar la plantilla `.github/PULL_REQUEST_TEMPLATE.md`.
- El PR debe pasar lint sin errores antes de solicitar revisión (`npm run lint`).
- Se requiere al menos **una aprobación** antes de hacer merge.
- Usar **merge commit** (`--no-ff`) para preservar el historial.

---

## Estándares de código

### TypeScript

- Tipado explícito en funciones públicas y servicios de datos.
- No usar `any` salvo casos muy justificados (documentar el motivo).
- Interfaces para modelos de datos, tipos para uniones y utilidades.

### React

- Componentes funcionales con hooks.
- Un componente por archivo.
- Lógica de datos en `src/lib/` (servicios), no directamente en los componentes.
- Estado global vía Contexts o TanStack Query; no prop drilling profundo.

### Estilos

- Tailwind CSS con clases utilitarias.
- Variantes de componentes con `class-variance-authority`.
- No escribir CSS custom salvo que sea absolutamente necesario.

### Verificar antes de hacer push

```bash
npm run lint      # ESLint
npm run build     # Compilación TypeScript + Vite
```

---

## Reporte de bugs

Usar la plantilla **🐛 Reporte de bug** en GitHub Issues.

Incluir siempre:
- Ambiente afectado (producción / desarrollo)
- Pasos exactos para reproducir
- Comportamiento actual vs. esperado
- Evidencia (captura de pantalla, log de consola)

---

## Solicitud de cambios

Usar la plantilla **📋 Solicitud de cambio** en GitHub Issues.

Incluir:
- Situación actual y problema que resuelve
- Módulos o rutas afectadas
- Criterios de aceptación medibles
- Estimación de esfuerzo (si es posible)

---

Para dudas sobre el flujo de trabajo, contactar al equipo a través de los Issues o directamente con el responsable del repositorio.
