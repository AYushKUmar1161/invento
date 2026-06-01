# ==========================================
# Build Stage
# ==========================================
FROM node:22-alpine AS build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Build step with API env variable fallback (built assets point to host default port 8000 or absolute path)
ENV VITE_API_URL=""

RUN npm run build

# ==========================================
# Production Stage
# ==========================================
FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
