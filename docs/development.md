# Development

## Local setup

Requires Node.js 20.19 or newer.

```sh
npm install
npm run dev
```

The playground opens at `http://127.0.0.1:8877`. If that port is occupied, Vite selects the next available port and prints its address.

The playground uses deterministic [15 × 30 sample data](../test/data/sample-data.ts). Browser tests are available at `http://127.0.0.1:8877/test/mocha/` while the development server is running.

## Checks

```sh
npm run typecheck
npm run build
npm run test:types
npm run pack:check
```

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Check the library source without emitting files |
| `npm run build` | Type-check, build package formats and CSS, then emit declarations |
| `npm run test:types` | Compile the public TypeScript usage tests |
| `npm run pack:check` | Show the files that would be included in the npm package |
| `npm run preview` | Serve the generated `dist` directory on port 8877 or the next free port |

## Release automation

The package version is defined in [`package.json`](../package.json). Publishing a GitHub Release, or manually dispatching the workflow, runs [`.github/workflows/publish.yml`](../.github/workflows/publish.yml). The workflow installs dependencies, builds, checks the public TypeScript declarations, and publishes to GitHub Packages using the repository's `GITHUB_TOKEN`.
