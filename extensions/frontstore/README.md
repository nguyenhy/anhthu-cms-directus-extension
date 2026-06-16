## Local development

### podman container

```
podman run -d --name prod-cms \
   -p 127.0.0.1:8055:8055 \
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

### watch logs

```
podman logs --follow --tail 100 prod-cms
```
