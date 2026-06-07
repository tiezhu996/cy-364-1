FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev --no-audit --no-fund
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
COPY start.sh ./
RUN chmod +x start.sh
RUN npm install --omit=dev
RUN npx prisma generate
COPY --from=build /app/dist ./dist
EXPOSE 29504
CMD ["./start.sh"]
