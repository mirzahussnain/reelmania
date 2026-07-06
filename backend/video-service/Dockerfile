FROM node:24-alpine AS builder

WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /src
# The media-processing worker shells out to ffmpeg/ffprobe. Use the musl-native
# apk build rather than the glibc `ffmpeg-static` binaries (which can't run on
# Alpine); mediaProbe honours these paths via FFMPEG_PATH/FFPROBE_PATH.
RUN apk add --no-cache ffmpeg
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe
# Set environment variables for runtime
ENV VIDEO_DATABASE_URL=${VIDEO_DATABASE_URL}
ENV VIDEO_SERVICE_PORT=${VIDEO_SERVICE_PORT}
ENV CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV AZURE_STORAGE_CONNECTION_STRING=${AZURE_STORAGE_CONNECTION_STRING}
ENV AZURE_STORAGE_ACCOUNT_NAME=${AZURE_STORAGE_ACCOUNT_NAME}
ENV AZURE_SHARED_KEY=${AZURE_SHARED_KEY}
ENV AZURE_BLOB_CONTAINER_NAME=${AZURE_BLOB_CONTAINER_NAME}
ENV AZURE_ACCOUNT_URL=${AZURE_ACCOUNT_URL}
ENV FRONTEND_URL=${FRONTEND_URL}
ENV SOCKET_PATH=${SOCKET_PATH}

COPY --from=builder /src/dist ./dist
COPY --from=builder /src/package*.json ./
COPY --from=builder /src/prisma ./prisma
RUN npm ci --production
RUN npx prisma generate
EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD npm run healthcheck
CMD ["npm", "start"]