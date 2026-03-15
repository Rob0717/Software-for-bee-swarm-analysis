# Software for Bee Swarm Analysis — Backend

Backend REST API for locating and managing bee swarm reports, built with NestJS and TypeORM.

---

## Tech Stack

| Technology          | Version | Purpose                              |
|---------------------|---------|--------------------------------------|
| **NestJS**          | 11      | Application framework                |
| **TypeORM**         | 0.3.28  | ORM and database migrations          |
| **MySQL / MariaDB** | —       | Relational database                  |
| **Passport + JWT**  | —       | Authentication via httpOnly cookies  |
| **Swagger**         | 11      | API documentation (development only) |
| **Nodemailer**      | 7       | Transactional email sending          |
| **nestjs-i18n**     | 10      | Internationalization (cs, en)        |
| **Multer**          | 2       | Swarm photo file uploads             |
| **Geolib**          | 3       | Geographic distance calculation      |
| **TypeScript**      | 5.7     | Typed language                       |

---

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **MySQL** or **MariaDB** instance

---

## Getting Started

### Install dependencies

`npm ci`

### Configure environment

Create a `.env` file in the project root based on the variables listed in the [Environment Variables](#environment-variables) section.

### Run database migrations

`npm run migration:run`

### Start development server

`npm run start:dev`

The API will be available at `http://localhost:3000/api`.

> In development mode, Swagger UI is available at `http://localhost:3000/api/doc`.
> Authenticate by calling `POST /api/auth/login` first — the `access_token` httpOnly cookie will be set automatically and used for all subsequent requests.

---

## Available Scripts

| Script                       | Description                                       |
|------------------------------|---------------------------------------------------|
| `npm run start`              | Start the application                             |
| `npm run start:dev`          | Start in watch mode for development               |
| `npm run start:debug`        | Start in debug + watch mode                       |
| `npm run start:prod`         | Start the compiled production build               |
| `npm run build`              | Compile the application                           |
| `npm run build-pipeline`     | Build and lint (used in CI/CD)                    |
| `npm run lint`               | Run ESLint                                        |
| `npm run lint:fix`           | Run ESLint with auto-fix                          |
| `npm run migration:generate` | Generate a new migration from entity changes      |
| `npm run migration:run`      | Run pending migrations (local/development)        |
| `npm run migration:docker`   | Run pending migrations (production/Docker)        |

---

## Project Structure

```
src/
├── apiary/                        # Apiary module
│   ├── dto/                       # ApiaryCreateRequestDto, ApiaryCreateResponseDto
│   ├── apiary.controller.ts       # REST endpoints for apiary management
│   ├── apiary.service.ts          # Business logic
│   └── apiary.module.ts
├── auth/                          # Authentication module
│   ├── dto/                       # Login, register, password reset DTOs
│   ├── auth.controller.ts         # REST endpoints for authentication
│   ├── auth.service.ts            # JWT, bcrypt, email verification logic
│   └── auth.module.ts
├── location/                      # Location module (Nominatim API proxy)
│   ├── dto/                       # Search and reverse geocoding DTOs
│   ├── interfaces/                # UnifiedQueueItem interface
│   ├── types/                     # QueueItemType
│   ├── location.controller.ts     # REST endpoints for address search
│   ├── location.service.ts        # Rate-limited Nominatim queue with caching
│   └── location.module.ts
├── report/                        # Swarm report module
│   ├── report.controller.ts       # REST endpoints for report management
│   ├── report.service.ts          # Report creation, assignment, status logic
│   └── report.module.ts
├── user/                          # User module
│   ├── user.controller.ts         # REST endpoints for user management
│   ├── user.service.ts            # User lookup, update, access management
│   └── user.module.ts
├── shared/                        # Shared module
│   ├── config/
│   │   └── multer.config.ts       # Multer file upload configuration
│   ├── decorators/
│   │   └── roles.decorator.ts     # @Roles() route decorator
│   ├── dto/                       # Shared DTOs (UserResponseDto, ReportResponseDto, ...)
│   ├── entities/                  # TypeORM entities (UserEntity, ReportEntity, ApiaryEntity)
│   ├── enums/                     # Shared enums (UserRole, ReportStatus)
│   ├── guards/                    # JwtAuthGuard, OptionalJwtAuthGuard, AccessGuard, RolesGuard
│   ├── interfaces/                # JwtPayload, AuthenticatedRequest, ...
│   ├── mappers/                   # ReportMapper, UserMapper
│   ├── sanitizers/                # SanitizeStringsPipe, sanitizeAny, sanitizeString
│   ├── services/                  # MailService, MailTemplateService
│   ├── strategies/                # JwtAccessStrategy (Passport)
│   └── shared.module.ts
├── migrations/                    # TypeORM migration files
├── i18n/                          # Email translation files
│   ├── cs/common.json             # Czech translations
│   └── en/common.json             # English translations
├── app-data-source.ts             # TypeORM DataSource for CLI migrations
├── app.module.ts                  # Root application module
└── main.ts                        # Application bootstrap
```

---

## Architecture

The project follows a standard **NestJS modular architecture**:

- **Controller** — handles HTTP requests, input validation and Swagger documentation
- **Service** — contains business logic, communicates with repositories
- **Repository** — TypeORM repositories injected via `@InjectRepository()`
- **Guard** — route protection (`JwtAuthGuard`, `AccessGuard`, `RolesGuard`)
- **Mapper** — converts entities to response DTOs

Authentication uses **JWT stored in httpOnly cookies** — tokens are never exposed to JavaScript. The `AccessGuard` verifies on every protected request that the user exists and is not banned.

---

## API Modules

| Module       | Base path       | Description                                                    |
|--------------|-----------------|----------------------------------------------------------------|
| **auth**     | `/api/auth`     | Login, logout, register, password reset, account confirmation  |
| **users**    | `/api/users`    | User profile, beekeeper list, user access management           |
| **reports**  | `/api/reports`  | Swarm report CRUD, status changes, takeover/release            |
| **apiaries** | `/api/apiaries` | Apiary management for beekeepers                               |
| **location** | `/api/location` | Address search and reverse geocoding via Nominatim             |

---

## Authentication & Authorization

JWT access tokens are stored as **httpOnly cookies** and automatically included in every request by the browser. Three guards protect routes:

- `JwtAuthGuard` — validates the JWT cookie, throws `401` if missing or invalid
- `AccessGuard` — verifies the user exists in DB and is not banned, throws `403` if banned
- `RolesGuard` — restricts access by user role (`ADMIN`, `BEEKEEPER`), used with `@Roles()` decorator

---

## Database Migrations

TypeORM migrations are used for all schema changes. The `synchronize` option is enabled **only in development** — in production all changes must go through migrations.

```bash
# Generate a new migration after entity changes
npm run migration:generate

# Apply pending migrations
npm run migration:run
```

---

## File Uploads

Swarm report photos are uploaded via `multipart/form-data` and stored on disk under `uploads/reports/`. Each file is renamed to a UUID to prevent collisions. Allowed formats: `jpg`, `jpeg`, `png`, `gif`, `webp`. Maximum file size: **10 MB**.

---

## Internationalization

Email notifications support **Czech** (`cs`) and **English** (`en`). Translation files are located in `src/i18n/`. The language is determined per-user based on their profile preference.

---

## Environment Variables

| Variable                             | Default | Description                                     |
|--------------------------------------|---------|-------------------------------------------------|
| `NODE_ENV`                           | —       | `development` or `production`                   |
| `BACKEND_PORT`                       | `3000`  | Port the application listens on                 |
| `BACKEND_URL`                        | —       | Public URL of the backend (used in emails)      |
| `FRONTEND_URL`                       | —       | Public URL of the frontend (CORS + email links) |
| `DB_HOSTNAME`                        | —       | Database host                                   |
| `DB_PORT`                            | `3306`  | Database port                                   |
| `DB_NAME`                            | —       | Database name                                   |
| `DB_USERNAME`                        | —       | Database username                               |
| `DB_PASSWORD`                        | —       | Database password                               |
| `MYSQL_ROOT_PASSWORD`                | —       | MariaDB root password (Docker only)             |
| `JWT_ACCESS_SECRET`                  | —       | Secret for signing access tokens                |
| `JWT_ACCESS_SECRET_DURATION`         | `4h`    | Access token expiry                             |
| `JWT_ACCOUNT_VERIFY_SECRET`          | —       | Secret for account confirmation tokens          |
| `JWT_ACCOUNT_VERIFY_SECRET_DURATION` | `1h`    | Account confirmation token expiry               |
| `JWT_RESET_PASSWORD_SECRET`          | —       | Secret for password reset tokens                |
| `JWT_RESET_PASSWORD_SECRET_DURATION` | `1h`    | Password reset token expiry                     |
| `SMTP_HOST`                          | —       | SMTP server host                                |
| `SMTP_PORT`                          | `587`   | SMTP server port                                |
| `SMTP_USER`                          | —       | SMTP username                                   |
| `SMTP_PASS`                          | —       | SMTP password                                   |

---

## Linting

ESLint is configured with TypeScript and NestJS rules.

#### Check for issues
`npm run lint`

#### Auto-fix where possible
`npm run lint:fix`

---

## Production Build

`npm run build`

Build artifacts are output to the `dist/` directory. Run with:

`npm run start:prod`