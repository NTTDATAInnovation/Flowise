# Build local monorepo image
# docker build --no-cache -t  flowise .

# Run image
# docker run -d -p 3000:3000 flowise

FROM node:18-alpine
RUN apk add --update libc6-compat python3 make g++
# needed for pdfjs-dist
RUN apk add --no-cache build-base cairo-dev pango-dev
# needed for run_container.sh
RUN apk add --no-cache jq


# Install Chromium
RUN apk add --no-cache chromium

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /usr/src/packages

# Copy root package.json and lockfile
COPY package.json yarn.loc[k] ./

# Copy components package.json
COPY packages/components/package.json ./packages/components/package.json
# NOTE: Due to the way dependencies are specified in the monorepo, and because all the individual sub-packages are published to npm
# we need to use yarn link to ensure that it's actually using our modified version of the components package
RUN cd packages/components && yarn link

# Copy ui package.json
COPY packages/ui/package.json ./packages/ui/package.json

# Copy server package.json
COPY packages/server/package.json ./packages/server/package.json
RUN cd packages/server && yarn link flowise-components

RUN yarn install

# Copy app source
COPY . .

RUN yarn build
RUN rm -rf /usr/local/share/.cache

EXPOSE 3000

ENTRYPOINT ["sh", "run_container.sh"]
