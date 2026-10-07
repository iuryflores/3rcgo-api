#!/usr/bin/env bash
set -euo pipefail
work="$1"
revision="$2"
[[ "$revision" =~ ^[a-f0-9]{40}$ ]]
base=/opt/3rcgo-api
test -f "$work/.env"
id ubuntu >/dev/null
pm2_bin=$(command -v pm2)
run_pm2() { sudo -u ubuntu env HOME=/home/ubuntu PM2_HOME=/home/ubuntu/.pm2 PATH="$PATH" "$pm2_bin" "$@"; }
mkdir -p "$base/releases/$revision"
release="$base/releases/$revision"
cp -a "$work/dist" "$work/package.json" "$work/package-lock.json" "$work/ecosystem.config.cjs" "$release/"
cd "$release"
npm ci --omit=dev
install -m 600 -o ubuntu -g ubuntu "$work/.env" "$release/.env"
port=$(node --env-file="$release/.env" -p "process.env.PORT")
chown -R ubuntu:ubuntu "$release"
previous=$(readlink "$base/current" || true)
ln -sfn "$release" "$base/current-$revision"
mv -Tf "$base/current-$revision" "$base/current"
run_pm2 startOrReload "$base/current/ecosystem.config.cjs" --only 3rcgo-server --update-env
for attempt in $(seq 1 15); do
  if curl --fail --silent "http://127.0.0.1:$port/health" >/dev/null; then
    run_pm2 save
    echo "API instalada no PM2 como 3rcgo-server: $revision"
    exit 0
  fi
  sleep 2
done
if [ -n "$previous" ]; then
  ln -sfn "$previous" "$base/rollback-$revision"
  mv -Tf "$base/rollback-$revision" "$base/current"
  run_pm2 startOrReload "$base/current/ecosystem.config.cjs" --only 3rcgo-server --update-env
fi
echo 'API não iniciou; release anterior restaurado quando disponível.' >&2
exit 1
