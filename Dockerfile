# ============================================================
# Stage 1: Build
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (mejor cache de capas)
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copiar el resto del código
COPY . .

# Variables de entorno para el build de Vite
# Se pasan como build args: docker build --build-arg VITE_SUPABASE_URL=...
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Compilar TypeScript + Vite
RUN npm run build

# ============================================================
# Stage 2: Servir con Nginx
# ============================================================
FROM nginx:1.27-alpine AS production

# Copiar los archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx (manejo de rutas React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Puerto expuesto
EXPOSE 80

# Health check básico
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
