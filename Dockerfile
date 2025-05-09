# Use the official Node.js image
FROM node:20.15.1
WORKDIR /usr/app

# Install dependencies and Playwright
RUN apt-get update && apt-get install -y python3 iputils-ping \
  libgstreamer1.0-0 libgstreamer-plugins-base1.0-0 libgstreamer-plugins-bad1.0-0 \
  libwoff1 libopus0 libwebp7 libwebpdemux2 libenchant-2-2 libgudev-1.0-0 \
  libsecret-1-0 libhyphen0 libgdk-pixbuf2.0-0 libegl1 libnotify4 libxslt1.1 \
  libevent-2.1-7 libgles2 libvpx7 libxcomposite1 libatk1.0-0 libatk-bridge2.0-0 \
  libepoxy0 libgtk-3-0 libharfbuzz-icu0 libmanette-0.2-0 libxkbcommon0 libflite1 \
  libx264-164 gstreamer1.0-libav gstreamer1.0-plugins-bad \
  gstreamer1.0-plugins-base gstreamer1.0-plugins-good \
  firefox-esr

# PNPM
RUN wget -qO /bin/pnpm "https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linuxstatic-x64" && chmod +x /bin/pnpm

# Bun
RUN npm install -g bun

# Copy package.json and prisma files
COPY ./package.json ./
COPY prisma ./prisma

# Install dependencies
RUN bun install

# Install Playwright with PNPM
# RUN pnpm exec playwright install --with-deps
RUN bunx playwright install --with-deps

# Install Playwright with YARN
# RUN yarn playwright install
# RUN yarn playwright install-deps
# RUN yarn playwright install --with-deps

# Copy only necessary files
COPY src ./src
COPY bin ./bin
COPY public ./public
COPY package.json ./
COPY tsconfig.json ./

# Generate Prisma schema
RUN bun run db

# Expose port and start application
EXPOSE 3000/tcp

# Use "npm" to avoid unexpected issues with "bun"
CMD ["npm", "run", "start"]