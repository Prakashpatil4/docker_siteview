# --- Stage 1: Build ---
FROM node:lts-alpine AS BUILD
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build -- --configuration=production

# --- Stage 2: Serve ---
FROM nginx:alpine

# Copy the Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ⚠️ FIX: Copy files into a 'siteops' subfolder to match your URL path
COPY --from=BUILD /app/dist/sitenov/browser /usr/share/nginx/html/siteops

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
