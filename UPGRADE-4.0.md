# UPGRADE

## Migrating from `exceljs` to `exceljsremake`

This fork is published to npm as `exceljsremake`. The public API is intended to stay compatible with upstream `exceljs`, so in most projects the migration is just a package rename.

### 1) Install / uninstall

```bash
npm uninstall exceljs
npm install exceljsremake
```

### 2) Update imports / requires

CommonJS:

```js
const ExcelJS = require("exceljsremake");
```

ESM:

```js
import ExcelJS from "exceljsremake";
```

### 3) ES5 build path (if you used it before)

If your project previously used `exceljs/dist/es5`, switch to:

```js
const ExcelJS = require("exceljsremake/dist/es5");
// or:
import ExcelJS from "exceljsremake/dist/es5";
```

### 4) Browser usage

If you referenced browser bundles directly, update paths to the new package name.
This package exposes browser bundles under:

- `dist/exceljs.min.js`
- `dist/exceljs.bare.min.js`

### 5) Node.js version requirement

`exceljsremake` requires Node.js **>= 20** (see `package.json` → `engines.node`).

### 6) CI note (browser Jasmine tests)

Some environments (notably GitHub Actions Linux runners) may hang when running the browser-based Jasmine suite via `grunt jasmine`.
If you only need the Node test suites in CI, use:

```bash
npm run test:ci
```

## `wb.createInputStream()` deprecation

| ExcelJS V3.9.\*                                   | ExcelJS v4                         |
| ------------------------------------------------- | ---------------------------------- |
| `stream.pipe(workbook.xlsx.createInputStream());` | `await workbook.xlsx.read(stream)` |
|                                                   |                                    |

## Stream Reading

While upgrading to version 4 you get more ways to stream reading file.

### Iterating over all rows in all sheets.

We strongly recommend using this way, because it's 20% faster than any other and you get flow control

```js
const workbook = new ExcelJS.stream.xlsx.WorkbookReader("./file.xlsx");
for await (const worksheetReader of workbookReader) {
  for await (const row of worksheetReader) {
    // ...
    // continue, break, return
  }
}
```

### Iterating over all events.

```js
const options = {
  sharedStrings: "emit",
  hyperlinks: "emit",
  worksheets: "emit",
};
const workbook = new ExcelJS.stream.xlsx.WorkbookReader("./file.xlsx", options);
for await (const { eventType, value } of workbook.parse()) {
  switch (eventType) {
    case "shared-strings":
    // value is the shared string
    case "worksheet":
    // value is the worksheetReader
    case "hyperlinks":
    // value is the hyperlinksReader
  }
}
```

### As a readable stream.

```js
const options = {
  sharedStrings: "emit",
  hyperlinks: "emit",
  worksheets: "emit",
};
const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(
  "./file.xlsx",
  options,
);
workbookReader.read();
workbookReader.on("worksheet", (worksheet) => {
  worksheet.on("row", (row) => {});
});
workbookReader.on("shared-strings", (sharedString) => {
  // ...
});
workbookReader.on("hyperlinks", (hyperlinksReader) => {
  // ...
});
workbookReader.on("end", () => {
  // ...
});
workbookReader.on("error", (err) => {
  // ...
});
```
