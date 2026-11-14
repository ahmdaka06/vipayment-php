# syntax=docker/dockerfile:1

# ---- build ----
FROM node:24-alpine AS builder

WORKDIR /app

# VITE_* values are inlined into the browser bundle at build time.
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web ./
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine AS runner

COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
