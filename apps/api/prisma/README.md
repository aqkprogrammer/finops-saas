# Database Setup

## Prerequisites

- PostgreSQL database
- DATABASE_URL environment variable set in `.env`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set DATABASE_URL in `apps/api/.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/vehicle_ai_db?schema=public"
```

3. Generate Prisma Client:
```bash
npm run prisma:generate
```

4. Run migrations:
```bash
npm run prisma:migrate
```

## Schema

- `Vehicle`: Base vehicle table
- `VehicleAiReport`: AI analysis results with status tracking

## Migration Commands

- `npm run prisma:migrate` - Create and apply new migration
- `npm run prisma:migrate:deploy` - Apply migrations in production
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:studio` - Open Prisma Studio GUI
