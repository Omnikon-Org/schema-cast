# Schema Cast Architecture

## 1. New Architecture

Schema Cast functions as a pipeline that enriches standard JSON Schema rather than replacing it. It acts similar to Prisma or TypeORM but operates natively on a JSON Schema graph.

*   **Layer 1: Standard JSON Schema:** The foundation. Defines data structures using `properties`, `$ref`, `type`, `enum`, `required`, and `items`. Validatable by any standard validator.
*   **Layer 2: Extension Metadata:** The `"x-schema-cast"` namespace object injected into schema definitions to define things JSON Schema cannot (e.g., ORM details, database indexing, relation types).
*   **Layer 3: Schema Cast Compiler:** The core engine. It parses a graph of interconnected schemas, resolves `$ref` pointers natively, validates standard schema rules, and extracts the `x-schema-cast` metadata into a unified Internal Representation (IR).
*   **Layer 4: Generators:** Pluggable generator modules that consume the IR to produce:
    *   **ORM Models:** (Mongoose, Prisma schemas, TypeORM)
    *   **Databases:** (PostgreSQL, MySQL migrations/DDL)
    *   **SDKs/Types:** (TypeScript, Rust, Go, Python, Java, C#)
    *   **API Specs:** (OpenAPI with generated paths)
    *   **Documentation:** (Markdown, HTML)

## 2. Compiler Design

1.  **Discovery & Resolution:** The compiler crawls a directory (e.g., `./schemas`), finding all `.schema.json` files. It uses a standard `$ref` resolver (`@apidevtools/json-schema-ref-parser`) to build a complete dependency graph without custom parsing.
2.  **Validation:** The un-augmented schema is passed through a standard validator (`ajv`) to ensure the user wrote valid JSON Schema.
3.  **Extraction & Enrichment:** The compiler traverses the valid AST. When it finds a standard property, it checks for an `x-schema-cast` key. It merges standard constraints (like `maxLength`) with Schema Cast metadata (like `primaryKey: true`).
4.  **Internal Representation (IR):** The resulting IR is a flat, easily consumable graph of Models, Fields, and Relationships.
5.  **Generation:** Target-specific generators loop over the IR. Because the IR understands both structure and relationships, a PostgreSQL generator can easily produce foreign keys, and a Go generator can produce structs.

## 3. Extension Specification (`x-schema-cast`)

The `"x-schema-cast"` object can be attached to any property or the root schema.

**Root Schema Extensions:**
```json
"x-schema-cast": {
  "model": "User",
  "tableName": "users",
  "indexes": [
    { "fields": ["email", "status"], "unique": true }
  ],
  "softDelete": true,
  "timestamps": true
}
```

**Property/Field Extensions:**
```json
"x-schema-cast": {
  "primaryKey": true,
  "unique": true,
  "dbType": "uuid",
  "relationship": "many-to-one",
  "cascadeDelete": true,
  "ownership": true
}
```

## 4. Migration Architecture

Migrations in Schema Cast rely on IR comparison, not manual SQL generation.

1.  **State Capture:** Schema Cast saves a snapshot of the parsed IR into `.schema-cast/snapshot-v1.json`.
2.  **Diffing Engine:** When the developer alters `user.schema.json` and runs `schema-cast migrate`, the engine compiles the new IR (v2) and compares it against the snapshot (v1).
3.  **Plan Generation:** The engine identifies added schemas (create table), removed schemas (drop table), added standard properties (add column), and changes in `x-schema-cast` constraints (e.g., adding an index).
4.  **Target Output:** The diff is passed to the SQL generator which produces raw SQL (or Prisma migrations). Migration metadata is intentionally kept separate from the current state of the schema.

## 5. SDK Generation Architecture

SDK generation bridges the gap between raw validation and developer usability.

1.  **Typed AST:** The Schema Cast IR creates an abstract object layer (e.g., an object has properties, relationships, and enums).
2.  **Language Plugins:** Dedicated generators take the IR and map JSON types (`string`, `number`, `boolean`, `array`, `object`) to language-specific paradigms:
    *   **TypeScript:** Interfaces, standard Types, Zod Validators.
    *   **Rust:** `struct` with `serde` macros, utilizing `Option<T>` for non-`required` properties.
    *   **Go:** `type struct` with json tags and pointer types.
    *   **Python:** Pydantic models.
3.  **Relationship Mapping:** If a `$ref` has `"relationship": "many-to-one"`, the SDK generator outputs a populated type in TypeScript (`author: User`), or a lazy-loaded method in robust ORM clients.

## 6. Future Roadmap

*   **Q3 2026:** Native OpenAPI v3 generation from Schema Cast projects (nearly 1:1 mapping).
*   **Q4 2026:** Advanced migration generation engine (diffing `.schema.json` snapshots).
*   **Q1 2027:** Universal Client API SDK generation (TypeScript, Rust, Go, Python clients with built-in networking tied to the schema).
*   **Q2 2027:** Visual Schema Graph Editor (built on top of standard JSON schema tooling).

## 7. Why this design is superior

Inventing a new schema language (e.g., custom YAML/JSON DSLs) creates a walled garden. Developers must learn custom syntax, and you are forced to build proprietary VS Code extensions, formatters, and validators from scratch. 

By strictly adhering to standard JSON Schema and using `x-schema-cast`:
1.  **Zero Learning Curve:** Everyone already knows how to write JSON Schema.
2.  **Free Tooling:** VS Code gives autocompletion and linting for free via `$schema`.
3.  **Interoperability:** The exact same `.schema.json` file can be served to standard OpenAPI specs, validated at runtime with AJV on the edge, or sent to Spectral for linting.
4.  **Separation of Concerns:** The structure of data remains pure; persistence details (ORM logic) are safely isolated inside `x-schema-cast`. Validators simply ignore `x-schema-cast`.
5.  **Standardization:** Features like `allOf`, `oneOf`, and `patternProperties` are incredibly hard to build properly in a custom language but are natively understood here.
