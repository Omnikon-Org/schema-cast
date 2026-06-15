# schema-bridge

A powerful code generation tool to create a single source-of-truth for your application's data layer. 

Define your schema once in JSON or YAML, and `schema-bridge` automatically generates:
1. TypeScript interfaces/types
2. Zod validation schemas
3. MongoDB (Mongoose) models
4. PostgreSQL `CREATE TABLE` SQL statements

## Installation

```bash
npm install -g schema-bridge
# OR
npx schema-bridge generate ...
```

## Usage

### 1. Define your Schema (`user.schema.json`)
```json
{
  "name": "User",
  "fields": [
    { "name": "id", "type": "uuid", "required": true, "primary": true },
    { "name": "email", "type": "string", "required": true, "unique": true },
    { "name": "age", "type": "number", "required": false },
    { "name": "role", "type": "enum", "values": ["admin", "user", "guest"], "default": "user" },
    { "name": "createdAt", "type": "date", "required": true },
    { "name": "profile", "type": "object", "fields": [
      { "name": "bio", "type": "string" },
      { "name": "avatar", "type": "string" }
    ]}
  ]
}
```

### Supported Field Types
- `string`, `number`, `boolean`, `date`, `uuid`, `email`, `url`, `enum`, `object`, `array`

### Options
- `required: boolean`: Is the field required? (default: false)
- `unique: boolean`: Enforce unique constraint
- `primary: boolean`: Mark as Primary Key (used in Postgres, mapped to `_id` in Mongoose)
- `default: any`: Specify a default value
- `values: string[]`: Used specifically with `enum` type
- `fields: FieldDefinition[]`: Used specifically with `object` type
- `items: FieldDefinition`: Used specifically with `array` type

### 2. Generate Code
```bash
# Generate from a single file
schema-bridge generate --input ./schemas/user.schema.json --out ./generated

# Process all schemas in a directory
schema-bridge generate --all --input ./schemas/ --out ./generated

# Watch mode - automatically regenerate on save
schema-bridge watch --input ./schemas/
```

### Generated Files

The CLI will generate four files in the target directory per schema:
- `user.types.ts`: TypeScript definition
- `user.zod.ts`: Zod schema declaration
- `user.model.ts`: Mongoose model schema
- `user.sql`: PostgreSQL CREATE TABLE command

## License
MIT
