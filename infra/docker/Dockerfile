FROM node:20.11.1-alpine3.19

RUN apk add --no-cache tini \
  && addgroup -S sandbox \
  && adduser -S -G sandbox -h /home/sandbox sandbox \
  && mkdir -p /workspace/project /opt/runner/bin /home/sandbox \
  && chown -R sandbox:sandbox /workspace/project /opt/runner /home/sandbox

COPY infra/docker/bin/read-log.mjs /opt/runner/bin/read-log.mjs
COPY infra/docker/bin/write-file.mjs /opt/runner/bin/write-file.mjs

ENV HOME=/tmp \
    NODE_ENV=production

WORKDIR /workspace/project
USER sandbox
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--version"]
