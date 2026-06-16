- [Directus Extension Auto Reload Not Working with Podman on macOS](#directus-extension-auto-reload-not-working-with-podman-on-macos)
  - [Host](#host)
  - [Container](#container)
    - [Directus Configuration](#directus-configuration)
  - [Symptoms](#symptoms)
- [Fix 1: Trigger Reload After Build](#fix-1-trigger-reload-after-build)
- [Fix 2: Watch Mode Does Not Detect Changes from host machine](#fix-2-watch-mode-does-not-detect-changes-from-host-machine)

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
