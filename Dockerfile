FROM node:lts AS build
WORKDIR /src
RUN npm install npm@10.9.1 --global --no-audit --no-fund --no-update-notifier --loglevel verbose
RUN npm install node-jq --global --no-audit --no-fund --no-update-notifier --loglevel verbose
COPY "package.json" "package-lock.json" "./"
RUN npm clean-install --no-audit --no-fund --no-update-notifier
COPY "." "."
ARG GIT_COMMIT=Unknown
RUN <<EOT
	Version=$(cat package.json | npx node-jq .version --raw-output)
	echo "export namespace Version { export const app = '$Version'; export const commit = '${GIT_COMMIT}'; }" > src/generated/version.ts
EOT
RUN npm run build:docker

FROM nginx:stable AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /app