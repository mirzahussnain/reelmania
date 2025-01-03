FROM node:18-alpine as builder
WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /src
COPY --from=builder /src/dist ./dist
COPY --from=builder /src/package*.json ./
COPY --from=builder /src/prisma ./prisma
RUN npm ci --production
RUN npx prisma generate
EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD npm run healthcheck
CMD ["npm", "start"]