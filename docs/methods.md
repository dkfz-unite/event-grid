# Methods

Methods are called on the `EventGrid` object returned by the constructor. They are not configuration properties.

```js
const grid = new EventGrid(configuration);
grid.render();

grid.setCrosshair(true);
grid.resize(900, 480);
```

## Reference

| Method | Effect |
| --- | --- |
| `grid.render()` | Render the configured grid |
| `grid.resize(width, height)` | Set new matrix dimensions and redraw |
| `grid.cluster()` | Apply frequency-based row and column ordering |
| `grid.sortColumns(comparator)` | Sort the current columns |
| `grid.sortRows(comparator)` | Sort the current rows and recalculate column order |
| `grid.removeColumns(predicate)` | Remove matching columns and their events |
| `grid.removeRows(predicate)` | Remove matching rows and their events |
| `grid.setHeatmap(active)` | Explicitly set heat-map mode |
| `grid.toggleHeatmap()` | Invert heat-map mode |
| `grid.setGridLines(active)` | Explicitly set grid-line visibility |
| `grid.toggleGridLines()` | Invert grid-line visibility |
| `grid.setCrosshair(active)` | Explicitly set crosshair interaction |
| `grid.toggleCrosshair()` | Invert crosshair interaction |
| `grid.reload()` | Rebuild from the original constructor configuration |
| `grid.destroy()` | Remove the EventGrid DOM |

## Rendering and size

### `grid.render(): void`

Renders the grid. Call it once after construction and after attaching any listeners that must observe initial render lifecycle events.

```js
const grid = new EventGrid(configuration);
grid.render();
```

### `grid.resize(width: number, height: number): void`

Recalculates positions and redraws with numeric matrix dimensions. The final height may be greater than requested when needed to satisfy `configuration.minCellHeight`.

```js
grid.resize(960, 540);
```

## Ordering

### `grid.cluster(): void`

Orders rows by the number of occupied columns, then orders columns by event presence from the first row downward. Multiple events in one cell count as one occupied cell for ordering.

```js
grid.cluster();
```

### `grid.sortColumns(comparator): void`

Sorts the current column objects with a standard array comparator and redraws.

```js
grid.sortColumns((a, b) => String(a.label).localeCompare(String(b.label)));
```

### `grid.sortRows(comparator): void`

Sorts the current rows, recalculates column scores from that row order, sorts the columns accordingly, and redraws.

```js
grid.sortRows((a, b) => Number(a.priority) - Number(b.priority));
```

## Filtering

### `grid.removeColumns(predicate): void`

Removes every current column for which `predicate(column)` returns `true`. Events referencing removed columns are also removed.

```js
grid.removeColumns((column) => column.archived === true);
```

### `grid.removeRows(predicate): void`

Removes every current row for which `predicate(row)` returns `true`. Events referencing removed rows are also removed.

```js
grid.removeRows((row) => row.hidden === true);
```

These operations affect the grid's working copy. Call `grid.reload()` to restore the original constructor data.

## Display modes

Each mode has an explicit setter and a convenience toggle:

```js
grid.setHeatmap(true);
grid.toggleHeatmap();

grid.setGridLines(true);
grid.toggleGridLines();

grid.setCrosshair(true);
grid.toggleCrosshair();
```

| Setter | Effect when `true` |
| --- | --- |
| `grid.setHeatmap(active)` | Replace segmented cell events with count-darkened heat-map cells |
| `grid.setGridLines(active)` | Show row and column lines |
| `grid.setCrosshair(active)` | Show row and column crosshairs during grid interaction |

Heat-map and grid-line initial values can also be set with `configuration.heatMap` and `configuration.grid`. Crosshair mode is controlled only by methods.

## Lifecycle

### `grid.reload(): void`

Destroys the current rendering, clones the original constructor configuration again, restores configured ordering and display modes, and renders. Runtime removals, custom sorts, and toggles are discarded; dimensions set by the latest `resize()` call are retained.

```js
resetButton.addEventListener('click', () => grid.reload());
```

### `grid.destroy(): void`

Removes the rendered grid and its container. Destroy the instance before permanently removing its host or replacing it with a new configuration.

```js
grid.destroy();

const replacement = new EventGrid(nextConfiguration);
replacement.render();
```
