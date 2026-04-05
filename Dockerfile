FROM node:22-alpine AS builder
RUN apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Variables nécessaires à l'évaluation de nuxt.config.ts au moment du build
ARG SUPABASE_URL
ARG SUPABASE_KEY
ARG STORYBLOK_TOKEN
ARG STORYBLOK_VERSION=published
ARG STORYBLOK_REGION=eu
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_KEY=$SUPABASE_KEY
ENV STORYBLOK_TOKEN=$STORYBLOK_TOKEN
ENV STORYBLOK_VERSION=$STORYBLOK_VERSION
ENV STORYBLOK_REGION=$STORYBLOK_REGION

COPY . .
ENV NODE_OPTIONS=--max-old-space-size=3072
RUN npm run build

FROM node:22-alpine AS runner
RUN apk upgrade --no-cache
WORKDIR /app
COPY --from=builder /app/.output ./.output
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
