# Software for Bee Swarm Analysis — Frontend

Frontend application for locating and managing bee swarm reports, built with Angular 20 and PrimeNG.

---

## Tech Stack

| Technology       | Version | Purpose                                   |
| ---------------- | ------: | ----------------------------------------- |
| **Angular**      | 20.3.19 | Application framework                     |
| **PrimeNG**      |  20.0.0 | UI component library                      |
| **Tailwind CSS** |     4.1 | Utility-first CSS framework               |
| **Leaflet**      |   1.9.4 | Interactive maps                          |
| **Transloco**    |     8.2 | Internationalization in Czech and English |
| **RxJS**         |     7.8 | Reactive programming                      |
| **TypeScript**   |     5.8 | Typed language                            |

---

## Prerequisites

- Node.js 22+
- npm 10+

---

## Getting Started

### Local development

#### Install dependencies

```bash
npm ci
```

#### Start development server

```bash
npm start
```

The application will be available at `http://127.0.0.1:4200`.

The development server uses [`proxy.conf.json`](proxy.conf.json) to forward `/api` and `/uploads` requests to the backend running at `http://127.0.0.1:3000`.

---

## Available Scripts

| Script                   | Description                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| `npm start`              | Start the development server                                     |
| `npm run build`          | Build the application for production                             |
| `npm run watch`          | Build in watch mode for development                              |
| `npm run lint`           | Run ESLint                                                       |
| `npm run lint-fix`       | Run ESLint with auto-fix                                         |
| `npm run build-pipeline` | Build and lint the application                                   |
| `npm run generate:api`   | Generate TypeScript types from the backend OpenAPI specification |
| `npm run split:dtos`     | Split generated types into individual DTO files                  |
| `npm run generate:dtos`  | Run both `generate:api` and `split:dtos`                         |

---

## Configuration

### Changing the Backend Port

If the backend runs on a different port than the default `3000`, update these files:

| File                                       | What to change                                    |
| ------------------------------------------ | ------------------------------------------------- |
| [`proxy.conf.json`](./proxy.conf.json)     | `target` URL in the `/api` and `/uploads` entries |
| [`generate-types.ts`](./generate-types.ts) | `apiUrl` variable                                 |

For production Docker deployment, API and upload requests are proxied by Nginx in `nginx.conf` to the backend container.

---

## Project Structure

```text
FE/
├── public/
│   └── assets/
│       ├── i18n/                          # Translation files (cs.json, en.json)
│       ├── logo.png                       # Application logo
│       ├── logo.svg                       # Application logo in vector format
│       ├── marker-icon.png                # Leaflet map marker icon
│       ├── marker-icon-2x.png             # Leaflet retina map marker icon
│       └── marker-shadow.png              # Leaflet marker shadow
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── menu/                      # Navigation menu
│   │   │       ├── presentation/          # MenuComponent
│   │   │       └── services/              # MenuService
│   │   ├── core/
│   │   │   ├── guards/                    # AuthGuard, AdminGuard, UnregisteredGuard
│   │   │   ├── i18n/                      # PrimeNG i18n initialization
│   │   │   ├── interceptors/              # HTTP interceptor
│   │   │   └── services/                  # LanguageService
│   │   ├── pages/
│   │   │   ├── admin/                     # Admin section
│   │   │   │   ├── base/facades/          # AdminFacade
│   │   │   │   ├── persistent/repositories/ # AdminRepository
│   │   │   │   ├── presentation/          # UsersComponent
│   │   │   │   └── routes/                # adminRoutes
│   │   │   ├── auth/                      # Authentication section
│   │   │   │   ├── base/facades/          # AuthFacade, ApiaryFacade
│   │   │   │   ├── persistent/repositories/ # AuthRepository, ApiaryRepository
│   │   │   │   ├── presentation/          # Login, Register, Profile, Password reset, Confirmation
│   │   │   │   └── routes/                # authRoutes
│   │   │   ├── reports/                   # Swarm reports section
│   │   │   │   ├── base/facades/          # ReportFacade
│   │   │   │   ├── persistent/repositories/ # ReportRepository
│   │   │   │   ├── presentation/          # ReportsComponent, CreateReportComponent
│   │   │   │   └── routes/                # reportRoutes
│   │   │   ├── forbidden/                 # 403 page
│   │   │   ├── home/                      # Home page
│   │   │   └── notfound/                  # 404 page
│   │   ├── shared/
│   │   │   ├── components/presentation/   # Reusable presentation components
│   │   │   │   └── generic-map/           # Reusable Leaflet map component
│   │   │   ├── enums/                     # Shared enums
│   │   │   ├── facades/                   # LocationFacade
│   │   │   ├── helpers/                   # FormHelper
│   │   │   ├── models/generated-dtos/     # Generated DTO types from OpenAPI
│   │   │   ├── repositories/              # LocationRepository
│   │   │   └── services/                  # AlertService, ProfileTabService
│   │   ├── app.component.*
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── transloco.loader.ts
│   ├── index.html
│   ├── main.ts
│   ├── mypreset.ts                        # Custom PrimeNG theme preset
│   └── styles.css
├── environment.ts                         # API URL and production flag
├── proxy.conf.json                        # Development proxy configuration
├── nginx.conf                             # Production Nginx configuration
└── generate-types.ts                      # OpenAPI type generation script
```

---

## Architecture

The project follows the Facade/Repository pattern:

- **Repository** is responsible for HTTP communication with the backend and returns `Observable` values.
- **Facade** provides an abstraction layer for components and coordinates state and application logic.
- **Component** represents the presentation layer and communicates with facades instead of calling repositories directly.

All components are standalone. Routing is lazy-loaded per feature section.

---

## API Type Generation

The project uses `openapi-typescript` to generate TypeScript types from the backend OpenAPI specification. A custom script then splits generated types into individual DTO files.

```bash
npm run generate:dtos
```

The backend must be running in development mode, because the generator reads the OpenAPI specification from `http://127.0.0.1:3000/api/doc-json`.

Generated DTO files are placed in folder [`generated-dtos`](src/app/shared/models/generated-dtos/). They include request and response types for authentication, apiaries, reports, users and location endpoints.

---

## Internationalization

The application supports Czech (`cs`) and English (`en`). Translation files are located in [`public/assets/i18n/`](public/assets/i18n/).

The active language is persisted in `localStorage` and synchronized with the HTML `lang` attribute.

To add a new language:

1. Add the new language code to `availableLangs` in [`app.config.ts`](src/app/app.config.ts).

2. Add the language option to [`language.service.ts`](src/app/core/services/language.service.ts), including its display label and language code.

3. Create a new translation file in [`public/assets/i18n/`](public/assets/i18n/) using the same structure as the existing translation files.

For example, to add German support, add `de` to the list of available languages, add a `Deutsch` option to the language service, and create a `de.json` translation file.

---

## Authentication and Authorization

An HTTP interceptor sends credentials with each request so that httpOnly authentication cookies are included. It also handles selected global error states.

The application uses three route guards:

- [`AuthGuard`](src/app/core/guards/auth.guard.ts) allows access only to authenticated users.
- [`AdminGuard`](src/app/core/guards/admin.guard.ts) allows access only to users with the `ADMIN` role.
- [`UnregisteredGuard`](src/app/core/guards/unregistered.guard.ts) allows access only to unauthenticated users, mainly for login and registration pages.

---

## Linting

```bash
# Check for issues
npm run lint

# Auto-fix where possible
npm run lint-fix
```

---

## Production Build

```bash
npm run build
```

Build artifacts are generated in `dist/software-for-bee-swarm-analysis/browser/`, which is copied into the Nginx image during Docker build.
