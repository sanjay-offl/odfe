# ODFE Cafe POS

ODFE is a cafe point-of-sale and operations interface for managing orders, tables,
menu items, customers, inventory, staff, and sales reports.

## What is included

- Point of sale, checkout, receipts, and order management
- Kitchen and customer-display screens
- Table and reservation management
- Menu, category, customer, inventory, and employee management
- Dashboard, reports, and role-based demo access

## Project structure

- `frontend/` contains the React, TypeScript, and Vite cafe POS application.
- `backend/` contains the Java 21 and Spring Boot backend module.
- The repository root also contains a separate Next.js starter application. Use
  the `frontend/` commands below to run the cafe POS.

The cafe POS currently runs in demo mode. Its service layer uses seeded data and
browser storage; the Vite development server proxies `/api` and `/ws` requests to
the backend at `http://localhost:8080`.

## Requirements

- Node.js and npm to run the frontend
- JDK 21 and Maven to run the backend

## Run the cafe POS

From the repository root:

```sh
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The sign-in screen provides
demo accounts and one-tap role selection.

## Run the backend

In a separate terminal, from the repository root:

```sh
cd backend
mvn spring-boot:run
```

The backend listens on port `8080` by default. Its default configuration uses
an in-memory H2 database and development settings; configure suitable values
before using it outside local development.

## Tests and production build

Run the frontend tests and build from `frontend/`:

```sh
npm test
npm run build
```

To preview the production build locally, first run `npm run build`, then:

```sh
npm run preview
```

Run the backend test lifecycle from `backend/`:

```sh
mvn test
```

There are currently no backend test sources.

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Zustand, and Vitest
- Backend: Java 21, Spring Boot, Maven, and H2 by default
