<div align="center">

# schema-bridge

**One schema. Four outputs. Zero drift.**

[![npm version](https://img.shields.io/npm/v/schema-bridge?color=red&style=flat-square)](https://www.npmjs.com/package/schema-bridge)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Build](https://img.shields.io/github/actions/workflow/status/Demon-Die/schema-bridge/ci.yml?style=flat-square)](https://github.com/Demon-Die/schema-bridge/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/Demon-Die/schema-bridge/pulls)

Define your data model **once** in JSON or YAML — `schema-bridge` generates TypeScript types, Zod validators, Mongoose models, and PostgreSQL SQL, all kept in sync automatically.

[Getting Started](#installation) · [CLI Reference](#cli) · [Field Types](#supported-field-types) · [Contributing](#contributing)

</div>

---

## The Problem

In a typical fullstack project, the same data shape is written **four separate times**:

```
User interface → TypeScript
Request validation → Zod
Database model → Mongoose
Table definition → SQL
```

They drift. They conflict. You update one and forget the rest. `schema-bridge` solves this with a single source of truth.

---

## What It Generates

Given one `.schema.json` file, `schema-bridge` produces:

| Output | File | Description |
|--------|------|-------------|
| TypeScript | `user.types.ts` | Interfaces and type definitions |
| Zod | `user.zod.ts` | Runtime validation schema |
| Mongoose | `user.model.ts` | MongoDB model with schema |
| PostgreSQL | `user.sql` | `CREATE TABLE` statement |

---

## Installation

```bash
# Global install (recommended for CLI use)
npm install -g schema-bridge

# Or use without installing
npx schema-bridge generate --input ./schemas/user.schema.json --out ./generated
```

---

## Quick Start

### 1. Define Your Schema

Create a `user.schema.json` file:

```json
{
  "name": "User",
  "fields": [
    { "name": "id",        "type": "uuid",   "required": true, "primary": true },
    { "name": "email",     "type": "email",  "required": true, "unique": true },
    { "name": "age",       "type": "number", "required": false },
    { "name": "role",      "type": "enum",   "values": ["admin", "user", "guest"], "default": "user" },
    { "name": "createdAt", "type": "date",   "required": true },
    { "name": "profile",   "type": "object", "fields": [
      { "name": "bio",    "type": "string" },
      { "name": "avatar", "type": "url" }
    ]}
  ]
}
```

### 2. Generate

```bash
schema-bridge generate --input ./schemas/user.schema.json --out ./generated
```

### 3. Use the Output

Four files land in `./generated/`:

<details>
<summary><strong>user.types.ts</strong> — TypeScript interface</summary>

```typescript
export interface User {
  id: string;
  email: string;
  age?: number;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
  profile?: {
    bio?: string;
    avatar?: string;
  };
}
```

</details>

<details>
<summary><strong>user.zod.ts</strong> — Zod validation schema</summary>

```typescript
import { z } from 'zod';

export const UserSchema = z.object({
  id:        z.string().uuid(),
  email:     z.string().email(),
  age:       z.number().optional(),
  role:      z.enum(['admin', 'user', 'guest']).default('user'),
  createdAt: z.date(),
  profile: z.object({
    bio:    z.string().optional(),
    avatar: z.string().url().optional(),
  }).optional(),
});

export type User = z.infer<typeof UserSchema>;
```

</details>

<details>
<summary><strong>user.model.ts</strong> — Mongoose model</summary>

```typescript
import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  email:     { type: String, required: true, unique: true },
  age:       { type: Number },
  role:      { type: String, enum: ['admin', 'user', 'guest'], default: 'user' },
  createdAt: { type: Date, required: true },
  profile: {
    bio:    { type: String },
    avatar: { type: String },
  },
});

export const UserModel = model('User', UserSchema);
```

</details>

<details>
<summary><strong>user.sql</strong> — PostgreSQL CREATE TABLE</summary>

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR NOT NULL UNIQUE,
  age        INTEGER,
  role       VARCHAR CHECK (role IN ('admin', 'user', 'guest')) DEFAULT 'user',
  created_at TIMESTAMP NOT NULL,
  profile    JSONB
);
```

</details>

---

## CLI

### `generate` — Generate from one or all schemas

```bash
# Single file
schema-bridge generate --input ./schemas/user.schema.json --out ./generated

# Entire directory
schema-bridge generate --all --input ./schemas/ --out ./generated
```

| Flag | Description |
|------|-------------|
| `--input` | Path to a `.schema.json` / `.schema.yaml` file or directory |
| `--out` | Output directory for generated files |
| `--all` | Process all schema files in the input directory |

### `watch` — Auto-regenerate on change

```bash
schema-bridge watch --input ./schemas/
```

Only regenerates files whose schema changed — fast and non-destructive.

---

## Supported Field Types

| Type | TypeScript | Zod | Mongoose | PostgreSQL |
|------|-----------|-----|----------|------------|
| `string` | `string` | `z.string()` | `String` | `VARCHAR` |
| `number` | `number` | `z.number()` | `Number` | `NUMERIC` |
| `boolean` | `boolean` | `z.boolean()` | `Boolean` | `BOOLEAN` |
| `date` | `Date` | `z.date()` | `Date` | `TIMESTAMP` |
| `uuid` | `string` | `z.string().uuid()` | `String` | `UUID` |
| `email` | `string` | `z.string().email()` | `String` | `VARCHAR` |
| `url` | `string` | `z.string().url()` | `String` | `VARCHAR` |
| `enum` | `'a' \| 'b'` | `z.enum([...])` | `{ enum: [...] }` | `CHECK (col IN (...))` |
| `object` | `{ ... }` | `z.object({...})` | Nested schema | `JSONB` |
| `array` | `T[]` | `z.array(...)` | `[{ type: T }]` | `JSONB` |

---

## Field Options

| Option | Type | Description |
|--------|------|-------------|
| `required` | `boolean` | Whether the field must be present (default: `false`) |
| `unique` | `boolean` | Enforce unique constraint (Mongoose + PostgreSQL) |
| `primary` | `boolean` | Mark as primary key — `_id` in Mongoose, `PRIMARY KEY` in SQL |
| `default` | `any` | Default value applied across all outputs |
| `values` | `string[]` | Enum values — required when `type` is `"enum"` |
| `fields` | `FieldDefinition[]` | Nested fields — required when `type` is `"object"` |
| `items` | `FieldDefinition` | Item type — required when `type` is `"array"` |

---

## YAML Support

YAML schemas are supported alongside JSON:

```yaml
name: Post
fields:
  - name: title
    type: string
    required: true
  - name: tags
    type: array
    items:
      type: string
  - name: status
    type: enum
    values: [draft, published, archived]
    default: draft
```

---

## Project Structure

```
schema-bridge/
├── src/
│   ├── index.ts              # Public API entry point
│   ├── parser.ts             # JSON / YAML schema parser
│   ├── generators/
│   │   ├── typescript.ts     # TypeScript interface generator
│   │   ├── zod.ts            # Zod schema generator
│   │   ├── mongoose.ts       # Mongoose model generator
│   │   └── postgres.ts       # SQL CREATE TABLE generator
│   ├── cli.ts                # CLI entry point (commander.js)
│   └── watcher.ts            # Watch mode (chokidar)
└── tests/
    └── generators.test.ts
```

---

## Contributing

Contributions are welcome. DemonDie is an open source community — if you're building with React, Next.js, Node.js, or any modern web stack, this tool is for you.

```bash
git clone https://github.com/Demon-Die/schema-bridge.git
cd schema-bridge
npm install
npm run dev
```

To run tests:

```bash
npm test
```

Please open an issue before submitting large PRs. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Built by DemonDie

`schema-bridge` is part of the [DemonDie](https://github.com/Demon-Die) open source ecosystem — a community building developer tools, web applications, AI/ML solutions, and community platforms.

---

## License

MIT © [DemonDie](https://github.com/Demon-Die)
