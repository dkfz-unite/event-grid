# Publishing

The package version comes from `package.json`.

```sh
npm version patch
git push --follow-tags
```

Use `minor`, `major`, or an explicit version when appropriate. Publish a GitHub Release from the generated tag; [`publish.yml`](../.github/workflows/publish.yml) then runs:

1. `npm ci`
2. `npm run build`
3. `npm run test:types`
4. `npm publish`

The workflow publishes to GitHub Packages with the repository's `GITHUB_TOKEN`.
