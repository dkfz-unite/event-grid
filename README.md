# OncoGrid

OncoGrid renders a generic matrix of columns, rows, and typed events. It includes colored event-frequency histograms, metadata tracks, multiple events per cell, sorting, clustering, grid lines, and crosshair interaction.

![OncoGrid playground](docs/images/oncogrid-playground.jpg)

## About this fork

This is a modern package forked from the [original OncoJS OncoGrid](https://github.com/oncojs/oncogrid) and decoupled from its ICGC bioinformatics topic. Donors, genes, mutations, and consequences are now generic columns, rows, events, and event types.

The fork adds:

- a typed data interface and native `EventTarget` API;
- TypeScript source and declarations;
- Vite library builds for ESM, CommonJS, and UMD;
- npm installation through GitHub Packages;
- default component styles and event colors.

## Install

Configure GitHub Packages once, then install:

```sh
npm install @dkfz-unite/oncogrid
```

See [Getting started](docs/getting-started.md#install-from-github-packages) for the required `.npmrc`.

## Quick start

```js
import OncoGrid from '@dkfz-unite/oncogrid';
import '@dkfz-unite/oncogrid/style.css';

const grid = new OncoGrid({
  element: '#grid',
  columns: [{ id: 'c1', label: 'Alpha' }],
  rows: [{ id: 'r1', label: 'Planning' }],
  events: [
    { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'active' }
  ]
});

grid.addEventListener(OncoGrid.eventNames.gridClick, ({ detail }) => {
  console.log(detail.column, detail.row, detail.events);
});

grid.render();
```

## Documentation

| Page | Contents |
| --- | --- |
| [Getting started](docs/getting-started.md) | Installation and modern JavaScript usage |
| [Data interface](docs/data-interface.md) | Columns, rows, events, tracks, stacking, and colors |
| [API](docs/api.md) | Options, methods, and native events |
| [Styling](docs/styling.md) | Default CSS, selectors, and overrides |
| [TypeScript](docs/typescript.md) | Generic types and typed event details |
| [Publishing](docs/publishing.md) | Versioning and the release workflow |

## Develop

Requires Node.js 20.19 or newer.

```sh
npm install
npm run dev          # http://127.0.0.1:8877
npm run build
npm run test:types
npm run pack:check
```

The playground uses deterministic [15 × 30 sample data](test/data/sample-data.js).

## Attribution

Based on the [original `oncogrid` package](https://www.npmjs.com/package/oncogrid) by the OncoJS contributors, originally developed for ICGC at the Ontario Institute for Cancer Research. This fork is maintained under the DKFZ UNITE package scope.
