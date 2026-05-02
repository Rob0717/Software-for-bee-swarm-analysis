# Software for Bee Swarm Analysis

![Application preview](image.png)

A web application for locating and managing bee swarm reports. A citizen can create a swarm report on an interactive map, and the system assigns the nearest suitable beekeeper and sends an email notification with report details and navigation links.

| Layer              | Stack                                                          |
| ------------------ | -------------------------------------------------------------- |
| **Frontend**       | Angular 20, PrimeNG, Leaflet, Tailwind CSS, Transloco (cs/en)  |
| **Backend**        | NestJS 11, TypeORM, MySQL, JWT in httpOnly cookies, Nodemailer |
| **Infrastructure** | Docker Compose, Nginx, MySQL 8.4, persistent uploads volume    |

For more detailed documentation, see the [`Frontend README`](./FE/README.md) and [`Backend README`](./BE/README.md).

---

## Docker Deployment

This repository contains a Docker Compose configuration for running the complete application stack: MySQL database, migrations, backend and frontend.

### Prerequisites

- Docker
- Docker Compose

### First Deployment

1. Create a `.env` file in the project root based on [`.env.example`](.env.example).

   - The following values must be configured before deployment:
 
      - `JWT_ACCESS_SECRET`, `JWT_ACCOUNT_VERIFY_SECRET`, `JWT_RESET_PASSWORD_SECRET` 
        - Secret keys used for signing JWT tokens. Use strong random strings.
        - For example, they can be generated [here](https://jwtsecrets.com/#generator).
      
      - `DB_USERNAME`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`  
        - Database credentials used by the backend and MySQL container.
     
      - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
        - SMTP configuration used for sending account verification, password reset and report notification emails.
        - The SMTP port depends on the selected email provider. Common values are `587` for STARTTLS and `465` for SSL/TLS.
     
      - `USER_AGENT`  
        - User agent used for Nominatim requests. Replace `<email>` with a valid contact email address.

2. In the [`Frontend environment`](./FE/environment.ts) file, set the `production` flag to `true`.

3. Build images and start all services:

```bash
docker compose up -d --build
```

### Common Commands

#### Start containers

```bash
docker compose up -d
```

#### Stop containers without deleting data

```bash
docker compose down
```

#### Rebuild and redeploy without deleting data

```bash
docker compose down
docker compose build
docker compose up -d
```

#### Show running containers

```bash
docker compose ps
```

#### Show logs

```bash
docker compose logs -f
```

---

## Database Access

Connect to the database inside the running MySQL container:

```bash
docker compose exec mysql mysql -u root -p software_for_bee_swarm_analysis
```

If the database name was changed in `.env`, replace `software_for_bee_swarm_analysis` with the value of `DB_NAME`.

### Initial Admin Account

The application does not create an administrator account automatically.

To create the first administrator, register a new user in the application as a beekeeper. Then update the user's role directly in the database.

Example:

```sql
UPDATE user_entity
SET role = 'admin', verified = true
WHERE email = 'admin@example.com';
```

Replace `admin@example.com` with the email address used during registration.

---

## Factory Reset

The following command stops all containers and permanently deletes all Docker volumes, including database data and uploaded files:

```bash
docker compose down -v
```
