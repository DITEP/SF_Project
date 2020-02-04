FROM node:latest

#Set working directory
WORKDIR /app

#Copy everything but what is in the dockerignore file
COPY package.json .
COPY src src
COPY public public

#Run this on docker start. npm install is run here so the image is less heavy (but longer to start)
CMD npm install \
  && npm start
