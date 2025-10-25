FROM node:18-alpine

# Instalar git (necessário para dependências do npm)
RUN apk add --no-cache git

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
