FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV PACKAGE_ASSISTANT_DATA_DIR=/app/data
ENV PACKAGE_ASSISTANT_PROFILE_DIR=/app/browser-profiles
ENV PACKAGE_ASSISTANT_ARTIFACT_DIR=/app/var
ENV PACKAGE_ASSISTANT_HEADLESS=true
ENV PACKAGE_ASSISTANT_TIMEZONE=Asia/Shanghai

CMD ["node", "dist/server.js"]
