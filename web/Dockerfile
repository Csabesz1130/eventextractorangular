# build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build -- --prod

# production stage
FROM nginx:1.25-alpine

# Note: Update the dist path below to match your angular.json outputPath
# Common patterns: dist/<project-name> or dist
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

