FROM node:lts
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .
# ENV BOT_TOKEN
# ENV DATABASE_URL
# ENV DIRECT_URL
# ENV WH_DOMAIN=conatainer-webhook-domain
ENV WH_PORT=443
EXPOSE ${WH_PORT}
CMD if [ "$ENVIRONMENT" = "migrate" ]; then npm run start:migrate:prod; else npm run start:prod; fi
