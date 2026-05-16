# =========================================================
# STAGE 1 — BUILD REACT APPLICATION
# =========================================================

FROM node:20-alpine AS builder

# =========================================================
# METADATA
# =========================================================

LABEL maintainer="Subramanyam"
LABEL application="react-frontend"
LABEL environment="production"

# =========================================================
# CREATE APP DIRECTORY
# =========================================================

WORKDIR /app

# =========================================================
# INSTALL DEPENDENCIES
# =========================================================

COPY package*.json ./

RUN npm ci

# =========================================================
# COPY SOURCE CODE
# =========================================================

COPY . .

# =========================================================
# BUILD APPLICATION
# =========================================================

RUN npm run build

# =========================================================
# STAGE 2 — NGINX PRODUCTION SERVER
# =========================================================

FROM nginx:stable-alpine

# =========================================================
# INSTALL SECURITY UPDATES
# =========================================================

RUN apk upgrade --no-cache

# =========================================================
# REMOVE DEFAULT NGINX FILES
# =========================================================

RUN rm -rf /usr/share/nginx/html/*

# =========================================================
# COPY REACT BUILD FILES
# =========================================================

COPY --from=builder /app/dist /usr/share/nginx/html

# =========================================================
# CREATE NON-ROOT USER
# =========================================================

RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup

# =========================================================
# NGINX PERMISSIONS
# =========================================================

RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d

# =========================================================
# CREATE NGINX PID DIRECTORY
# =========================================================

RUN touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# =========================================================
# SWITCH TO NON-ROOT USER
# =========================================================

USER appuser

# =========================================================
# EXPOSE APPLICATION PORT
# =========================================================

EXPOSE 80

# =========================================================
# HEALTH CHECK
# =========================================================

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
CMD wget --quiet --tries=1 --spider http://localhost || exit 1

# =========================================================
# START NGINX
# =========================================================

CMD ["nginx", "-g", "daemon off;"]