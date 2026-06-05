# 🚌 BusEcuador — Sistema de Gestión de Transporte

Plataforma web para la gestión integral de cooperativas de transporte interprovincial. Permite a los pasajeros buscar y reservar boletos con selección de asiento, y a las cooperativas administrar rutas, frecuencias, buses, choferes y boletos desde un panel centralizado.

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite 8 |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Estado | TanStack Query v5 |
| Routing | React Router v7 |
| Formularios | React Hook Form + Zod |
| QR | qrcode.react + html5-qrcode |
| PDF | jsPDF |
| Despliegue | Docker + Nginx |

---

## 📁 Estructura del proyecto

```
src/
├── components/
│   └── ui/              # Componentes reutilizables (Layout, SeatConfigurator, etc.)
├── contexts/            # AuthContext, ThemeContext, LanguageContext, CooperativaContext
├── hooks/               # Hooks personalizados
├── integrations/
│   └── supabase/        # Cliente Supabase
├── lib/                 # Servicios de datos (rutas, buses, boletos, usuarios, etc.)
└── pages/
    ├── dashboard/       # Panel de administración (admin / oficinista)
    ├── Auth.tsx
    ├── Buscar.tsx
    ├── PaginaCompra.tsx
    ├── MisReservas.tsx
    ├── Boleto.tsx
    └── ChoferDashboard.tsx
```

---

## 👥 Roles del sistema

| Rol | Acceso |
|---|---|
| `passenger` | Buscar viajes, comprar boletos, ver reservas |
| `oficinista` | Dashboard: boletos y frecuencias |
| `chofer` | Panel de chofer: ver viajes asignados |
| `administrador` | Acceso completo: rutas, buses, usuarios, cooperativa |

---

## 🚀 Inicio rápido

### Prerrequisitos

- Node.js 20+
- npm 10+
- Cuenta en [Supabase](https://supabase.com)

### Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/ProyectoManejo.git
cd ProyectoManejo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 4. Levantar en modo desarrollo
npm run dev
```

La app estará disponible en `http://localhost:8080`.

### Variables de entorno

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

> ⚠️ Nunca subas el archivo `.env` al repositorio. Está incluido en `.gitignore`.

---

## 🐳 Despliegue con Docker

```bash
# Construir y levantar
docker compose up -d --build

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

La app quedará disponible en `http://localhost:80`.

> Las variables de entorno se inyectan en tiempo de **build** (no en runtime), ya que Vite las incrusta en el bundle estático.

---

## 🔀 Flujo de ramas (Git Flow)

```
main          ← producción estable, contiene tags de versión
develop       ← integración continua
feature/*     ← nuevas funcionalidades (salen de develop)
release/*     ← preparación de versión (salen de develop, van a main + develop)
hotfix/*      ← correcciones urgentes en producción (salen de main)
```

### Ciclo típico

```bash
# Nueva funcionalidad
git checkout -b feature/mi-funcionalidad develop
# ... trabajo ...
git checkout develop && git merge --no-ff feature/mi-funcionalidad

# Preparar release
git checkout -b release/1.1.0 develop
# ... ajustes finales ...
git checkout main && git merge --no-ff release/1.1.0
git tag -a v1.1.0 -m "Release 1.1.0"
git checkout develop && git merge --no-ff release/1.1.0
```

---

## 🗄️ Base de datos

Los scripts SQL de referencia están en `/sql`:

| Archivo | Descripción |
|---|---|
| `seed_buses_prueba.sql` | Datos de prueba para buses |
| `fix_rls_boletos.sql` | Políticas RLS para boletos |
| `fix_piso2_y_viajes.sql` | Correcciones de asientos y viajes |
| `viajes_23mayo.sql` | Datos de viajes de prueba |

---

## 📜 Licencia

MIT © 2026 Sebastián Acaro — ver [LICENSE](./LICENSE)
