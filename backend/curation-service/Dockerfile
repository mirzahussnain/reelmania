FROM node:24-alpine AS builder

WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /src
# Set environment variables for runtime
ENV CURATION_DATABASE_URL=${CURATION_DATABASE_URL}
ENV CURATION_SERVICE_PORT=${CURATION_SERVICE_PORT}
ENV CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV FRONTEND_URL=${FRONTEND_URL}
ENV RABBITMQ_URL=${RABBITMQ_URL}
ENV VIDEO_SERVICE_INTERNAL_URL=${VIDEO_SERVICE_INTERNAL_URL}

COPY --from=builder /src/dist ./dist
COPY --from=builder /src/package*.json ./
COPY --from=builder /src/prisma ./prisma
RUN npm ci --production
RUN npx prisma generate
EXPOSE 8002
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD npm run healthcheck
CMD ["npm", "start"]
