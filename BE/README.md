# Software for Bee Swarm Analysis — Backend

Backend REST API for locating and managing bee swarm reports, built with NestJS and TypeORM.

---

## Tech Stack

| Technology         |       Version | Purpose                                         |
| ------------------ | ------------: | ----------------------------------------------- |
| **NestJS**         |            11 | Application framework                           |
| **TypeORM**        |        0.3.28 | ORM and database migrations                     |
| **MySQL**          | 8.4 in Docker | Relational database                             |
| **mysql2**         |          3.12 | MySQL driver used by TypeORM                    |
| **Passport + JWT** |             — | Authentication via httpOnly cookies             |
| **Swagger**        |            11 | API documentation in development mode           |
| **Nodemailer**     |         8.0.5 | Transactional email sending                     |
| **nestjs-i18n**    |            10 | Email internationalization in Czech and English |
| **Multer**         |             2 | Swarm photo uploads                             |
| **Geolib**         |             3 | Geographic distance calculation                 |
| **TypeScript**     |           5.7 | Typed language                                  |

---

## Prerequisites

- Node.js 22+
- npm 10+
- MySQL instance

---

## Getting Started

### Install dependencies

```bash
npm ci
```

### Configure environment

#### Local development

For local backend development, create a `.env` file in the `BE` directory based on [`.env.example`](.env.example).

For Docker deployment, use the [`.env.example`](../.env.example) file in the project root, because [`docker-compose.yml`](../docker-compose.yml) loads environment variables from the root `.env` file.

#### Create database

Create a database with the name specified by `DB_NAME` in your `.env` file.

### Start development server

```bash
npm run start:dev
```

The API will be available at [`http://localhost:3000/api`](http://localhost:3000/api).

In development mode, Swagger UI is available at [`http://localhost:3000/api/doc`](http://localhost:3000/api/doc). Authenticate by calling `POST /api/auth/login`; the `access_token` httpOnly cookie is then set automatically and used for subsequent requests.

---

## Available Scripts

| Script                       | Description                                       |
| ---------------------------- | ------------------------------------------------- |
| `npm run start`              | Start the application                             |
| `npm run start:dev`          | Start in watch mode for development               |
| `npm run start:debug`        | Start in debug and watch mode                     |
| `npm run start:prod`         | Start the compiled production build               |
| `npm run build`              | Compile the application                           |
| `npm run build-pipeline`     | Build and lint the application                    |
| `npm run lint`               | Run ESLint                                        |
| `npm run lint:fix`           | Run ESLint with auto-fix                          |
| `npm run migration:generate` | Generate a new migration from entity changes      |
| `npm run migration:run`      | Run pending migrations locally                    |
| `npm run migration:docker`   | Run pending migrations from compiled Docker build |

---

## Project Structure

```text
src/
├── apiary/                        # Apiary module
│   ├── dto/                       # ApiaryCreateRequestDto, ApiaryCreateResponseDto
│   ├── apiary.controller.ts       # REST endpoints for apiary management
│   ├── apiary.service.ts          # Apiary business logic
│   └── apiary.module.ts
├── auth/                          # Authentication module
│   ├── dto/                       # Auth-specific request and response DTOs
│   │   ├── change-user-language-request.dto.ts
│   │   ├── set-new-password-request.dto.ts
│   │   ├── type-code-response.dto.ts
│   │   ├── user-logged-in-response.dto.ts
│   │   ├── user-login-request.dto.ts
│   │   ├── user-verify-account-response.dto.ts
│   │   ├── validate-set-new-password-request.dto.ts
│   │   └── validate-set-new-password-response.dto.ts
│   ├── auth.controller.ts         # Login, logout, registration, account confirmation and password reset endpoints
│   ├── auth.service.ts            # JWT, bcrypt, account verification and password reset logic
│   └── auth.module.ts
├── location/                      # Location module using the Nominatim API
│   ├── dto/                       # NominatimResultResponseDto
│   ├── interfaces/                # UnifiedQueueItem interface
│   ├── types/                     # QueueItemType
│   ├── location.controller.ts     # REST endpoints for address search and reverse geocoding
│   ├── location.service.ts        # Rate-limited Nominatim queue with caching
│   └── location.module.ts
├── report/                        # Swarm report module
│   ├── report.controller.ts       # Report creation, listing, status changes, takeover and removal endpoints
│   ├── report.service.ts          # Report creation, assignment, status and deletion logic
│   └── report.module.ts
├── user/                          # User module
│   ├── user.controller.ts         # User profile, beekeeper listing and access management endpoints
│   ├── user.service.ts            # User lookup, update and access management
│   └── user.module.ts
├── shared/                        # Shared application code
│   ├── config/                    # Multer file upload configuration
│   ├── decorators/                # @Roles() decorator
│   ├── dto/                       # DTOs shared across modules
│   │   ├── report/                # ChangeReportStatusRequestDto, ChangeReportStatusResponseDto, ReportResponseDto
│   │   └── user/                  # ManageUserAccessRequestDto, UserRegisterRequestDto, UserResponseDto
│   ├── entities/                  # TypeORM entities: UserEntity, ReportEntity, ApiaryEntity
│   ├── enums/                     # ReportStatus and UserRole enums
│   ├── guards/                    # JwtAuthGuard, OptionalJwtAuthGuard, AccessGuard, RolesGuard
│   ├── interfaces/                # Request, JWT payload, mail and report creation interfaces
│   ├── mappers/                   # Entity-to-DTO mappers for users and reports
│   ├── sanitizers/                # Global recursive string sanitization pipe
│   ├── services/                  # Mail services and template rendering
│   ├── strategies/                # JwtAccessStrategy
│   └── shared.module.ts
├── migrations/                    # TypeORM migration files
├── i18n/                          # Email translation files
│   ├── cs/common.json
│   └── en/common.json
├── app-data-source.ts             # TypeORM DataSource for CLI migrations
├── app.module.ts                  # Root application module and database configuration
└── main.ts                        # Application bootstrap, global prefix, validation, CORS and Swagger setup
```

Some DTOs are placed directly inside feature modules, for example authentication or apiary DTOs. DTOs reused by several modules are located in [`src/shared/dto/`](src/shared/dto/), especially user and report DTOs.

---

## Architecture

The backend follows a standard NestJS modular architecture:

- **Controller** handles HTTP requests, validates input through DTOs and provides Swagger metadata.
- **Service** contains business logic and works with TypeORM repositories.
- **Repository** is provided by TypeORM through `@InjectRepository()`.
- **DTO** defines request and response shapes used by controllers, validation and generated frontend types.
- **Guard** protects routes and checks authentication, access and roles.
- **Mapper** converts database entities to response DTOs.

Authentication uses JWT stored in an httpOnly cookie. The token is not exposed to JavaScript. Protected routes also use [`AccessGuard`](src/shared/guards/access.guard.ts), which checks whether the user still exists and is not banned.

---

## API Modules

| Module       | Base path       | Description                                                                           |
| ------------ | --------------- | ------------------------------------------------------------------------------------- |
| **auth**     | `/api/auth`     | Login, logout, registration, password reset, language change and account confirmation |
| **users**    | `/api/users`    | User profile, beekeeper list and user access management                               |
| **reports**  | `/api/reports`  | Swarm report creation, listing, status changes, takeover and removal                  |
| **apiaries** | `/api/apiaries` | Apiary management for beekeepers                                                      |
| **location** | `/api/location` | Address search and reverse geocoding via Nominatim                                    |

---

## Authentication and Authorization

JWT access tokens are stored as httpOnly cookies and automatically included in browser requests. Protected routes use these guards:

- [`JwtAuthGuard`](src/shared/guards/jwt-auth.guard.ts) validates the JWT cookie and returns `401` if it is missing or invalid.
- [`OptionalJwtAuthGuard`](src/shared/guards/optional-jwt-auth.guard.ts) allows selected endpoints to read the user from a JWT cookie when it is present, but does not require authentication.
- [`AccessGuard`](src/shared/guards/access.guard.ts) verifies that the user exists and is not banned.
- [`RolesGuard`](src/shared/guards/roles.guard.ts) restricts selected routes to specific roles such as `ADMIN` or `BEEKEEPER`.

---

## Database Migrations

TypeORM migrations are used for schema changes. In development mode, `synchronize` is enabled to simplify local work. In production and Docker deployment, schema changes should be applied through migrations.

```bash
# Generate a new migration after entity changes
npm run migration:generate

# Apply pending migrations
npm run migration:run
```

In Docker deployment, migrations run in a separate `migrate` service before the backend container starts.

---

## File Uploads

Swarm report photos are uploaded as `multipart/form-data` and stored on disk under `uploads/reports/`. Each file is renamed to a UUID-based filename to prevent collisions.

Allowed formats: `jpg`, `jpeg`, `png`, `gif`, `webp`. Maximum file size: 10 MB.

---

## Internationalization

Email notifications support Czech (`cs`) and English (`en`). Translation files are located in [`src/i18n/`](src/i18n/). The language is selected from the user's profile preference or from request parameters used in selected authentication flows.

---

## Environment Variables

| Variable                             | Example / default            | Description                                           |
| ------------------------------------ | ---------------------------- | ----------------------------------------------------- |
| `NODE_ENV`                           | `development` / `production` | Runtime environment                                   |
| `BACKEND_PORT`                       | `3000`                       | Port the application listens on                       |
| `BACKEND_URL`                        | `http://localhost:3000`      | Public backend URL used for uploaded photos in emails |
| `FRONTEND_URL`                       | `http://localhost:4200`      | Public frontend URL used for CORS and email links     |
| `DB_HOSTNAME`                        | `localhost` / `mysql`        | Database host                                         |
| `DB_PORT`                            | `3306`                       | Database port                                         |
| `DB_NAME`                            | —                            | Database name                                         |
| `DB_USERNAME`                        | —                            | Database username                                     |
| `DB_PASSWORD`                        | —                            | Database password                                     |
| `MYSQL_ROOT_PASSWORD`                | —                            | MySQL root password for Docker deployment             |
| `JWT_ACCESS_SECRET`                  | —                            | Secret for signing access tokens                      |
| `JWT_ACCESS_SECRET_DURATION`         | `1h`                         | Access token expiration                               |
| `JWT_ACCESS_SECRET_COOKIE_MAX_AGE`   | `1`                          | Access cookie lifetime in hours                       |
| `JWT_ACCOUNT_VERIFY_SECRET`          | —                            | Secret for account verification tokens                |
| `JWT_ACCOUNT_VERIFY_SECRET_DURATION` | `1h`                         | Account verification token expiration                 |
| `JWT_RESET_PASSWORD_SECRET`          | —                            | Secret for password reset tokens                      |
| `JWT_RESET_PASSWORD_SECRET_DURATION` | `1h`                         | Password reset token expiration                       |
| `SMTP_HOST`                          | —                            | SMTP server host                                      |
| `SMTP_PORT`                          | `587` / `465`                | SMTP server port                                      |
| `SMTP_USER`                          | —                            | SMTP username                                         |
| `SMTP_PASS`                          | —                            | SMTP password                                         |
| `USER_AGENT`                         | —                            | User agent required for Nominatim requests            |

---

## Linting

```bash
# Check for issues
npm run lint

# Auto-fix where possible
npm run lint:fix
```

---

## Production Build

```bash
npm run build
npm run start:prod
```

Build artifacts are generated in the `dist/` directory.
