# TaskFlow

TaskFlow es una plataforma SaaS B2B multi-tenant de gestión de proyectos: workspaces aislados por organización, tableros Kanban con drag-and-drop, roles y permisos (RBAC), y un dashboard de analítica de productividad por equipo.

## Stack

| Capa            | Tecnología                                                                 |
| --------------- | -------------------------------------------------------------------------- |
| Frontend        | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query |
| Backend         | NestJS, TypeScript, REST API, Passport + JWT                               |
| Base de datos   | PostgreSQL + Prisma ORM                                                    |
| Infraestructura | Docker, Docker Compose, GitHub Actions (CI), Jest + Supertest              |

## Estructura del monorepo

```
taskflow/
├── apps/
│   ├── web/        # Next.js frontend
│   └── api/         # NestJS backend
├── packages/
│   └── database/    # Prisma schema, client y seed
└── .github/workflows/main.yml
```

## Requisitos

- Node.js 20+
- pnpm 9+ (`corepack enable`)
- Docker Desktop

> Nota: Postgres se expone en el puerto host `5433` (no `5432`) para evitar choques con otras instancias locales de Postgres.

## Primeros pasos

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar Postgres
docker compose up -d postgres

# 3. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Migrar y sembrar la base de datos
pnpm prisma:migrate
pnpm --filter database seed

# 5. Arrancar en desarrollo
pnpm dev:api   # http://localhost:3001
pnpm dev:web   # http://localhost:3000
```

### Usuario demo (tras el seed)

- `owner@taskflow.dev` / `Password123!` (rol OWNER, organización `acme-inc`)
- `member@taskflow.dev` / `Password123!` (rol MEMBER)

## Scripts principales

| Comando         | Descripción                               |
| --------------- | ----------------------------------------- |
| `pnpm lint`     | Lint en todos los workspaces              |
| `pnpm format`   | Formatea con Prettier                     |
| `pnpm test`     | Tests unitarios (Jest)                    |
| `pnpm test:e2e` | Tests end-to-end del API (Supertest)      |
| `pnpm build`    | Build de producción de todos los paquetes |

## Flujo de trabajo

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para la estrategia de ramas, convención de commits y pipeline de CI.
