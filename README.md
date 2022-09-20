# Choxy

Choxy is a cloudflare workers cache proxy built on top of [hono](https://github.com/honojs/hono). It is usefull to cache external and optimized images, google fonts or all kinds of web requests.

## Proxy Endpoints

The proxy has endpoints to cache requests for different durations.

| Route | Duration |
| --- | --- |
| /fonts/* | cache google fonts for 1 year |
| /{n}s/* | cache for n **seconds** |
| /{n}m/* | cache for n **minutes** |
| /{n}h/* | cache for n **hours** |
| /{n}d/* | cache for n **days** |
| /{n}M/* | cache for n **months** |
| /{n}y/* | cache for n **years** |
