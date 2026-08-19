#!/bin/sh
set -eu

backup_dir="${BACKUP_DIR:-./backups}"
mkdir -p "$backup_dir"
backup_file="$backup_dir/duesoon-$(date -u +%Y%m%dT%H%M%SZ).dump"

docker compose exec -T duesoon-db sh -c \
  'pg_dump --format=custom --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  > "$backup_file"

printf 'Backup written to %s\n' "$backup_file"
