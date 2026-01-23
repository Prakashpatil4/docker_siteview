# --- Stage 1: Build ---
FROM node:lts-alpine AS BUILD
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration=production

# --- Stage 2: Serve ---
FROM nginx:alpine

# Remove default nginx static files to avoid seeing the "Welcome" page
RUN rm -rf /usr/share/nginx/html/*

# Copy the Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files into the 'siteops' subfolder
# Note: Ensure /app/dist/sitenov/browser is the correct path from your build
COPY --from=BUILD /app/dist/sitenov/browser /usr/share/nginx/html/siteops/

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
