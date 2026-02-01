#!/bin/sh
set -e
# Ensure uploads directory is writable by nodejs (uid 1001)
chown -R nodejs:nodejs /app/uploads 2>/dev/null || true
exec su-exec nodejs "$@"
