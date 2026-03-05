# Software for Bee Swarm Analysis — Frontend

Frontend application for locating and managing bee swarm reports, built with Angular 20 and PrimeNG.

---

## Tech Stack

| Technology       | Version | Purpose                       |
|------------------|---------|-------------------------------|
| **Angular**      | 20.3.17 | Application framework         |
| **PrimeNG**      | 20      | UI component library          |
| **Tailwind CSS** | 4       | Utility-first CSS framework   |
| **Leaflet**      | 1.9.4   | Interactive maps              |
| **Transloco**    | 8       | Internationalization (cs, en) |
| **RxJS**         | 7.8     | Reactive programming          |
| **TypeScript**   | 5.8     | Typed language                |

---

## Prerequisites

- **Node.js** 22+
- **npm** 10+

---

## Getting Started

### Install dependencies

`npm ci`

### Start development server

`npm start`

The application will be available at `http://127.0.0.1:4200`.

> The development server uses a proxy configuration (`proxy.conf.json`) to forward API requests to the backend.

---

## Available Scripts

| Script                   | Description                                     |
|--------------------------|-------------------------------------------------|
| `npm start`              | Start the development server                    |
| `npm run build`          | Build the application for production            |
| `npm run watch`          | Build in watch mode for development             |
| `npm run lint`           | Run ESLint                                      |
| `npm run lint-fix`       | Run ESLint with auto-fix                        |
| `npm run build-pipeline` | Build and lint (used in CI/CD)                  |
| `npm run generate:api`   | Generate TypeScript types from OpenAPI spec     |
| `npm run split:dtos`     | Split generated types into individual DTO files |
| `npm run generate:dtos`  | Run both `generate:api` and `split:dtos`        |

---

## Configuration

### Changing the Backend Port

If the backend runs on a different port than the default (`3000`), update the following files:

| File                        | What to change                                |
|-----------------------------|-----------------------------------------------|
| `proxy.conf.json`           | `target` URL in `/api` and `/uploads` entries |
| `scripts/generate-types.ts` | `apiUrl` variable                             |

> For production, the backend port is configured in `nginx.conf` inside the Docker setup.

---

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── menu/                      # Navigation bar (MenuComponent)
│   │       ├── presentation/          # UI component
│   │       └── services/              # MenuService
│   ├── core/
│   │   ├── guards/                    # Route guards (AuthGuard, AdminGuard, UnregisteredGuard)
│   │   ├── interceptors/              # HTTP interceptor (authorization, error handling)
│   │   ├── i18n/                      # PrimeNG i18n initialization
│   │   └── services/                  # LanguageService
│   ├── pages/
│   │   ├── admin/                     # Admin section (user management)
│   │   │   ├── base/facades/          # AdminFacade
│   │   │   ├── presentation/          # UsersComponent
│   │   │   ├── repositories/          # AdminRepository
│   │   │   └── routes/                # adminRoutes
│   │   ├── auth/                      # Authentication section
│   │   │   ├── base/facades/          # AuthFacade, ApiaryFacade
│   │   │   ├── persistent/repositories/ # AuthRepository, ApiaryRepository
│   │   │   ├── presentation/          # Login, Register, Profile, ForgottenPassword, SetNewPassword, ConfirmAccount
│   │   │   └── routes/                # authRoutes
│   │   ├── reports/                   # Swarm reports section
│   │   │   ├── base/facades/          # ReportFacade
│   │   │   ├── persistent/repositories/ # ReportRepository
│   │   │   ├── presentation/          # ReportsComponent, CreateReportComponent
│   │   │   └── routes/                # reportRoutes
│   │   ├── forbidden/                 # 403 page
│   │   ├── home/                      # Home page
│   │   └── notfound/                  # 404 page
│   └── shared/
│       ├── components/
│       │   └── generic-map/           # Reusable map component (Leaflet)
│       ├── enums/                     # Shared enums (UserRole, ReportStatus, ...)
│       ├── facades/                   # LocationFacade
│       ├── helpers/                   # FormHelper (validators, password strength)
│       ├── models/
│       │   └── generated-dtos/        # Auto-generated DTO types from OpenAPI
│       ├── repositories/              # LocationRepository (Nominatim API)
│       └── services/                  # AlertService, ProfileTabService
├── environment.ts                     # Environment configuration (API URL, ...)
├── index.html
├── main.ts
├── mypreset.ts                        # Custom PrimeNG theme preset
└── styles.css
public/
└── assets/
    ├── i18n/                          # Translation files (cs.json, en.json)
    ├── logo.png                       # Application logo
    ├── logo.svg                       # Application logo (vector)
    ├── marker-icon.png                # Leaflet map marker icon
    ├── marker-icon-2x.png             # Leaflet map marker icon (retina)
    └── marker-shadow.png              # Leaflet map marker shadow
```

---

## Architecture

The project follows the **Facade/Repository pattern**:

- **Repository** — responsible for HTTP communication with the backend, returns `Observable`
- **Facade** — abstraction layer over the repository for UI components, manages state and business logic
- **Component** — presentation layer, communicates only with Facade, never directly with Repository

All components are **standalone** (no NgModule). Routing is **lazy-loaded** per feature section.

---

## API Type Generation

The project uses `openapi-typescript` to generate TypeScript types from the backend OpenAPI specification, and a custom script to split them into individual DTO files.

`npm run generate:dtos`

Generated DTO files are placed in `src/app/shared/models/generated-dtos/`.

---

## Internationalization

The application supports **Czech** (`cs`) and **English** (`en`). Translation files are located in `src/assets/i18n/`. The active language is persisted in `localStorage` and synchronized with the HTML `lang` attribute.

---

## Authentication & Authorization

An HTTP interceptor automatically attaches credentials (cookies) to every request and globally handles `401` and `403` errors. The application uses three route guards:

- `AuthGuard` — allows access only to authenticated users
- `AdminGuard` — allows access only to users with the `ADMIN` role
- `UnregisteredGuard` — allows access only to unauthenticated users (login, registration)

---

## Linting

ESLint is configured with Angular, TypeScript, and Prettier rules.

#### Check for issues
`npm run lint`

#### Auto-fix where possible
`npm run lint-fix`

---

## Production Build

`npm run build`

Build artifacts are output to the `dist/software-for-bee-swarm-analysis` directory.
