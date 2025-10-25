# Imagem base
FROM node:18

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências (inclui git para forks do GitHub)
RUN apt-get update && apt-get install -y git
RUN npm install

# Copiar o restante do código
COPY . .

# Expor a porta
EXPOSE 3000

# Comando de start
CMD ["npm", "start"]
