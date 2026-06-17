- [Directus Extension Auto Reload Not Working with Podman on macOS](#directus-extension-auto-reload-not-working-with-podman-on-macos)
  - [Host](#host)
  - [Container](#container)
    - [Directus Configuration](#directus-configuration)
  - [Symptoms](#symptoms)
- [Fix 1: Trigger Reload After Build](#fix-1-trigger-reload-after-build)
- [Fix 2: Watch Mode Does Not Detect Changes from host machine](#fix-2-watch-mode-does-not-detect-changes-from-host-machine)
- [Local development](#local-development)
  - [CMS](#cms)
  - [DB](#db)
  - [DB Backup](#db-backup)
  - [Health](#health)

## Directus Extension Auto Reload Not Working with Podman on macOS

### Host

- Device: Mac Mini M1
- OS: macOS 26.5
- Editor: VSCode
- Extension source code edited from host machine

### Container

Directus is running in Podman with the following command:

```bash
podman run -d --name prod-cms \
  -p 127.0.0.1:8055:8055 \
  --env-file $(pwd)/.env \
  -v $(pwd)/extensions:/directus/extensions \
  -e NODE_OPTIONS="--max-old-space-size=512" \
  -e NODE_ENV="development" \
  docker.io/directus/directus
```

#### Directus Configuration

`.env`

```env
EXTENSIONS_AUTO_RELOAD=true
```

---

### Symptoms

Auto reload does NOT work when:

- Running `npm run build` from the host machine and container
- Running `npm run dev` and editing extension source code from the host machine and container

Even though the build succeeds and files in `dist/` are updated, Directus does not reload the extension.

---

## Fix 1: Trigger Reload After Build

Create `extension.config.js` at root of your extension dir:

```js
// directus/extension/my-extension
import fs from "fs";

export default {
  plugins: [
    {
      name: "directus-auto-reload",

      writeBundle() {
        const now = new Date();

        // similar to run `$ touch package.json`
        fs.utimesSync("package.json", now, now);
      },
    },
  ],
};
```

Run:

```bash
npm run build
```

You should see logs similar to:

```text
[10:49:37.775] INFO: Extensions unloaded
[10:49:37.911] INFO: Extensions loaded
[10:49:37.913] INFO: Extensions reloaded
```

---

## Fix 2: Watch Mode Does Not Detect Changes from host machine

Enable polling mode:

```json
{
  "scripts": {
    "dev": "CHOKIDAR_USEPOLLING=true directus-extension build -w --no-minify"
  }
}
```

## Local development

### CMS

```
set -e; \
podman rm -f prod-cms 2>/dev/null || true; \
podman run -d --name prod-cms \
   -p 127.0.0.1:8055:8055 \
   --restart unless-stopped \
   --replace \
   --memory 1024m \
   --network intranet \
   --env-file $(pwd)/.env \
   -v $(pwd)/extensions:/directus/extensions \
   -e NODE_OPTIONS="--max-old-space-size=512" \
   -e NODE_ENV="development" \
   docker.io/directus/directus
```

- `NODE_ENV="development"`: need to prevent none of `devDependencies` being install in production

```json
	"devDependencies": {
		"@directus/extensions-sdk": "18.0.0",
		"@types/node": "^25.9.3",
		"typescript": "^6.0.3"
	}
```

### DB

```
set -e; \
podman rm -f directus_postgres 2>/dev/null || true; \
podman secret rm postgres_db postgres_user postgres_password 2>/dev/null || true; \
sudo mkdir -p /mnt/lbs_disk_data-storage/pgdata; \
sudo chown -R ubuntu:ubuntu /mnt/lbs_disk_data-storage; \
podman unshare chown -R 70:70 /mnt/lbs_disk_data-storage/pgdata; \
echo ""; \
echo "password" > db_password.txt; \
DB_PASS=$(cat db_password.txt); \
echo "================================================================================"; \
echo "🔑 YOUR DATABASE CREDENTIALS (SAVE THESE SAFELY):"; \
echo "--------------------------------------------------------------------------------"; \
echo "Password:  $DB_PASS"; \
echo "================================================================================"; \
echo ""; \
podman secret create postgres_password db_password.txt; \
rm db_password.txt; \
echo ""; \
podman run -d \
  --name directus_postgres \
  --restart unless-stopped \
  --replace \
  --memory 512m \
  --network intranet \
  -v /mnt/lbs_disk_data-storage/pgdata:/var/lib/postgresql:Z \
  -v /mnt/lbs_disk_data-storage/pgconfig/postgresql.conf:/etc/postgresql/postgresql.conf:Z \
  --secret postgres_password,type=env,target=POSTGRES_PASSWORD \
  -p 127.0.0.1:5432:5432 \
  docker.io/library/postgres:18.4-alpine \
  -c config_file=/etc/postgresql/postgresql.conf
```

### DB Backup

```
podman run -d \
  --name pgbackups \
  --user 70:70 \
  --replace \
  --memory 64m \
  --network intranet \
  -p 8081:8081 \
  -v /mnt/lbs_disk_data-storage/pgbackups:/backups:Z,U \
  -e POSTGRES_HOST=directus_postgres \
  -e POSTGRES_DB=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_EXTRA_OPTS="-Z1 --schema=public --blobs" \
  -e SCHEDULE=@daily \
  -e BACKUP_ON_START=TRUE \
  -e BACKUP_KEEP_DAYS=7 \
  -e BACKUP_KEEP_WEEKS=4 \
  -e BACKUP_KEEP_MONTHS=6 \
  -e HEALTHCHECK_PORT=8081 \
  docker.io/prodrigestivill/postgres-backup-local:18-alpine
```

### Health

```
podman run -d \
  --name gatus \
  --memory 64m \
  --network intranet \
  -p 8080:8080 \
  -v /mnt/lbs_disk_data-storage/gatus/config.yaml:/config/config.yaml:Z,ro \
  -v /mnt/lbs_disk_data-storage/gatus/data:/data:Z,U \
  -e GATUS_CONFIG_PATH=/config/config.yaml \
  --memory=64m \
  --restart always \
  ghcr.io/twin/gatus:stable
```
