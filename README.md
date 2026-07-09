<div align="center">

# schema-cast

**A JSON Schema-first framework for validation, persistence, SDK generation, and migrations.**

[![npm version](https://img.shields.io/npm/v/schema-cast?color=red&style=flat-square)](https://www.npmjs.com/package/schema-cast)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)](https://www.typescriptlang.org/)

**Built by [Omnikon](https://github.com/Omnikon-Org) — Developer tools for the next generation.**

</div>

---

## The Philosophy

Schema Cast is **NOT** a replacement for JSON Schema. It is a powerful framework that **extends** JSON Schema.

By strictly adhering to the JSON Schema standard, you define your data models once. Schema Cast enriches these standard models with persistence logic, ORM bindings, and API definitions using the custom `x-schema-cast` namespace.

The `x-schema-cast` namespace follows the JSON Schema extension model: standard validators like AJV and Hyperjump safely ignore this key, while Schema Cast uses it to drive persistence, code generation, and migrations.

Because we use standard JSON Schema, your schemas remain 100% compatible with existing ecosystem tooling:
- **AJV / Hyperjump** for runtime validation
- **OpenAPI** for API specifications
- **VS Code** for free autocomplete and linting via `$schema`
- **Spectral** for linting

---

## Quick Start

### 1. Define Your Schema

Create a `user.schema.json` file using standard JSON Schema. Add ORM and relationship metadata under the `x-schema-cast` keyword:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/user.schema.json",
  "title": "User",
  "type": "object",
  "x-schema-cast": {
    "tableName": "users",
    "timestamps": true
  },
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "x-schema-cast": { "primaryKey": true }
    },
    "email": {
      "type": "string",
      "format": "email",
      "x-schema-cast": { "unique": true }
    },
    "role": {
      "type": "string",
      "enum": ["admin", "user", "guest"],
      "default": "user"
    }
  },
  "required": ["id", "email"],
  "additionalProperties": false
}
```

### 2. Generate Your Code

Schema Cast is designed to generate everything you need across your stack. Here's what's available today versus what's on the way:

**Available now**

| Output | Use Case |
|--------|----------|
| **Zod / AJV Wrappers** | Request and form validation |
| **Mongoose / Prisma / TypeORM** | Database models and ORM configurations |
| **PostgreSQL DDL** | Table and column generation from your schema |

**Planned (see [Roadmap](#roadmap))**

| Output | Use Case | Target |
|--------|----------|--------|
| **OpenAPI v3** | Full API specifications | Q3 2026 |
| **Automated migration diffing** | Schema-snapshot-based `ALTER` plans | Q4 2026 |
| **TypeScript / Rust / Go / Python SDKs** | Typed clients with built-in networking | Q1 2027 |

All outputs stay in sync automatically as your schemas change.

---

## How it Works

Schema Cast is designed as a modular compiler that works in 4 layers:

1. **Standard JSON Schema:** You write standard JSON Schema with `$ref` pointers.
2. **Extension Metadata:** You add `x-schema-cast` to properties to define relationships, primary keys, and indexes.
3. **Compiler Engine:** Schema Cast resolves `$ref` graphs natively, validates the JSON Schema, and extracts the metadata into a unified Internal Representation (IR).
4. **Generators:** The IR is passed to language-specific plugins to generate code.

### Relationships using `$ref`

We don't invent new syntax for relationships. We use standard `$ref` pointers enriched with metadata.

```json
{
  "properties": {
    "author": {
      "$ref": "./user.schema.json",
      "x-schema-cast": {
        "relationship": "many-to-one",
        "cascadeDelete": true
      }
    }
  }
}
```

---

## The Extension Specification (`x-schema-cast`)

All Schema Cast specific logic lives strictly inside the `x-schema-cast` object. It can be applied at the root schema level or the property level.

### Root Schema Options

| Option | Type | Description |
|--------|------|-------------|
| `model` | `string` | The explicit model name (defaults to schema title). |
| `tableName` | `string` | Database table or collection name. |
| `timestamps` | `boolean` | Automatically add `createdAt` and `updatedAt`. |
| `softDelete` | `boolean` | Enable soft deletes (`deletedAt`). |
| `indexes` | `object[]` | Define compound indexes across multiple properties. |

### Property Options

| Option | Type | Description |
|--------|------|-------------|
| `primaryKey` | `boolean` | Mark as the primary key. |
| `unique` | `boolean` | Enforce unique constraint. |
| `dbType` | `string` | Override the database column type (e.g., `VARCHAR(255)`). |
| `relationship` | `string` | `one-to-one`, `one-to-many`, `many-to-one`, `many-to-many`. |
| `cascadeDelete`| `boolean` | Delete child records when parent is deleted. |

---

## Migrations

Schema Cast's migration engine is under active development, targeted for **Q4 2026** (see [Roadmap](#roadmap)). Once shipped, it's designed to work like this, without requiring you to write manual SQL:

1. Schema Cast saves a snapshot of your schema graph.
2. When you modify your JSON schemas, `schema-cast migrate` diffs the new schemas against the snapshot.
3. It generates an explicit SQL migration plan (e.g., `ALTER TABLE users ADD COLUMN age INT`).

Today, Schema Cast can already generate PostgreSQL DDL directly from a schema; the diff-based migration planner on top of that is what's still in progress.

---

## Why this design?

Inventing a new schema language requires reinventing formatters, validators, and editor integrations.

By building natively on **JSON Schema**, Schema Cast gives you:
- **Zero Learning Curve:** If you know JSON Schema, you know Schema Cast.
- **Maximum Interoperability:** Use your schemas with any tool that accepts standard JSON Schema.
- **Zero Vendor Lock-In:** Your data definitions are standard; the framework just adds automation.

---


## License

MIT © [Omnikon](https://github.com/Omnikon-Org)
