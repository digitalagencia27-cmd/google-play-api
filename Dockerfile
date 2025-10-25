# Etapa 1: Construção
FROM node:18-alpine AS build

# Instala dependências do sistema necessárias
RUN apk add --no-cache git bash

WORKDIR /app

# Copia os arquivos de dependências e instala
COPY package*.json ./
RUN npm install

# Copia o restante do código e builda
COPY . .
RUN npm run build

# Etapa 2: Produção
FROM node:18-alpine AS production

WORKDIR /app

# Instala Git (se precisar de subdependências via Git) e Node production dependencies
RUN apk add --no-cache git bash

COPY --from=build /app /app
RUN npm install --only=production

EXPOSE 8080

CMD ["node", "server.js"]
