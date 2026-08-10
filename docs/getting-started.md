# Getting started

## Install from GitHub Packages

Add the registry and an environment-based token to the consuming project's `.npmrc`:

```ini
@dkfz-unite:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Set `GITHUB_PACKAGES_TOKEN` to a classic GitHub token with `read:packages`, then install:

```sh
npm install @dkfz-unite/event-grid
```

Do not commit a token value. See [GitHub's npm registry guide](https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).

## Use in modern JavaScript

Add a host element:

```html
<div id="grid"></div>
```

Import the component and its default styles from any ESM entry file:

```js
import EventGrid from '@dkfz-unite/event-grid';
import '@dkfz-unite/event-grid/style.css';

const grid = new EventGrid({
  element: '#grid',
  columns: [{ id: 'c1', label: 'Alpha' }],
  rows: [{ id: 'r1', label: 'Planning' }],
  events: [{
    id: 'e1',
    columnId: 'c1',
    rowId: 'r1',
    type: 'active'
  }]
});

grid.render();
```

Call `grid.destroy()` before permanently removing the host element. For replacement data, destroy the instance and construct a new one; `reload()` reuses the original constructor options.

The package supplies ESM, CommonJS, UMD, CSS, source maps, and TypeScript declarations. D3 and `lodash.clonedeep` are bundled and require no global scripts.
