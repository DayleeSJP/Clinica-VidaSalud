
# Imagen de Node.js
FROM node:22-alpine

# Directorio de trabajo del contenedor
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar el servidor
COPY server.js ./

# Usar usuario sin privilegios
USER node

# Puerto del backend
EXPOSE 8080

# Iniciar el servidor
CMD ["npm", "start"]
