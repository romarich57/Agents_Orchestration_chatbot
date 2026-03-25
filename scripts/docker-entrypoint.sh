#!/bin/sh
set -eu

mkdir -p /app/uploads
chown -R nextjs:nextjs /app/uploads

exec su-exec nextjs "$@"
