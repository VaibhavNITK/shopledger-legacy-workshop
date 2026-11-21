# Project guide

## Stack

- Node.js with CommonJS modules.
- Express 4 serves the API and static browser app; `body-parser` parses JSON request bodies.
- The browser UI is plain HTML, CSS, and JavaScript.
- Application data is stored in `data/db.json` through synchronous file reads and writes in `lib/store.js`.
- There is no test framework configured. The `test` script is a placeholder that exits with an error.

## Module map

- `server.js`: creates the Express app, serves `public/`, mounts API routers, and provides the printable invoice route.
- `config.js`: port, shop details, tax slabs, inventory defaults, and coupon definitions.
- `routes/`: Express handlers for products/coupons, orders, customers/settlements, and reports/pricing preview/export.
- `lib/`: business logic for orders, inventory, pricing, coupons, tax, customer ledger, dates, invoices, reports, and JSON persistence.
- `public/`: browser interface (`index.html`, `css/style.css`, `js/app.js`).
- `data/db.json`: current products, customers, orders, settlements, audit log, and ID counters.
- `docs/architecture.svg`: architecture diagram.

## Commands

- `npm start` — runs `node server.js` and listens on the configured port (default `3000`).
- `npm test` — currently a placeholder; it prints “Error: no test specified” and exits with status 1.

## Working rules

- Write characterization tests before changing behaviour.
- Change only the module the ticket is about.
- Tests must never touch `data/db.json`.
- Add no dependencies.
