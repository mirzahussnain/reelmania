FROM node:18-alpine as builder

WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /src
# Set environment variables for runtime
ENV USER_DATABASE_URL=${USER_DATABASE_URL}
ENV USER_SERVICE_PORT=${USER_SERVICE_PORT}
ENV CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV WEBHOOK_SIGNING_SECRET=${WEBHOOK_SIGNING_SECRET}
ENV FRONTEND_URL=${FRONTEND_URL}

COPY --from=builder /src/dist ./dist
COPY --from=builder /src/package*.json ./
COPY --from=builder /src/prisma ./prisma
RUN npm ci --production
RUN npx prisma generate
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD npm run healthcheck
CMD ["npm", "start"]