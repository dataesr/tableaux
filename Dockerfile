FROM node:24-alpine
# si on veut mongodump / mongorestore 
# RUN apk add --no-cache mongodb-tools
WORKDIR /app
COPY package*.json ./
COPY server ./server
RUN npm ci --silent
CMD ["npm", "run", "-w", "server", "start"]
EXPOSE 3000
