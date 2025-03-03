# Usa una imagen oficial de Node.js como base
FROM node:18

# Establece el directorio de trabajo
WORKDIR /app

# Instala Angular CLI globalmente
RUN npm install -g @angular/cli

# Copia el package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias de Angular
RUN npm install

# Copia todo el código fuente de la aplicación
COPY . .

# Expone el puerto en el que Angular sirve la app
EXPOSE 4200

# Comando para arrancar la aplicación
CMD ["ng", "serve", "--host", "0.0.0.0"]
