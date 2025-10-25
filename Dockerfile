FROM node:18-alpine

WORKDIR /app

# Copia os arquivos de dependências e instala
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta usada pela API
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "start"]
