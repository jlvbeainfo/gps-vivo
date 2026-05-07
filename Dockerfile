# Multi-stage build para el frontend con Vite y React

# Etapa 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine
# Copiamos los archivos estáticos construidos en la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html
# Copiamos configuración de nginx si es necesario (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
