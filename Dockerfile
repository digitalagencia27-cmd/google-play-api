# Usar uma imagem base oficial do Node.js
FROM node:18

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar os arquivos de dependências
COPY package.json package-lock.json ./

# Instalar as dependências
RUN npm install

# Copiar o restante dos arquivos do projeto
COPY . .

# Expor a porta que a aplicação usa (padrão: 3000, mas verifique no código)
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
