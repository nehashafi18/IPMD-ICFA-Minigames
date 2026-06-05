FROM node:20

WORKDIR /app

RUN apt-get update \
  && apt-get install -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY vms-admin /vms-admin
WORKDIR /vms-admin
RUN npm install
RUN npm run build

WORKDIR /app
COPY backend/package*.json ./
RUN npm install

COPY backend .
RUN mkdir -p uploads outputs data
RUN cp -r /vms-admin/dist /app/vms-admin-dist

EXPOSE 5001

CMD ["npm", "run", "dev"]
