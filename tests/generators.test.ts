import { describe, it, expect } from 'vitest';
import { SchemaDefinition } from '../src/types';
import { generateTypeScript } from '../src/generators/typescript';
import { generateZod } from '../src/generators/zod';
import { generateMongoose } from '../src/generators/mongoose';
import { generatePostgres } from '../src/generators/postgres';

const mockSchema: SchemaDefinition = {
  name: "User",
  fields: [
    { name: "id", type: "uuid", required: true, primary: true },
    { name: "email", type: "string", required: true, unique: true },
    { name: "age", type: "number", required: false },
    { name: "role", type: "enum", values: ["admin", "user", "guest"], default: "user" },
    { name: "createdAt", type: "date", required: true },
    { name: "profile", type: "object", fields: [
      { name: "bio", type: "string" },
      { name: "avatar", type: "string" }
    ]}
  ]
};

describe('Generators', () => {
  it('should generate valid TypeScript', () => {
    const output = generateTypeScript(mockSchema);
    expect(output).toContain('export interface User {');
    expect(output).toContain('id: string;');
    expect(output).toContain('email: string;');
    expect(output).toContain('age?: number;');
    expect(output).toContain("role?: 'admin' | 'user' | 'guest';");
    expect(output).toContain('createdAt: Date;');
    expect(output).toContain('profile?: {');
    expect(output).toContain('bio?: string;');
    expect(output).toContain('avatar?: string;');
  });

  it('should generate valid Zod schema', () => {
    const output = generateZod(mockSchema);
    expect(output).toContain('export const UserSchema = z.object({');
    expect(output).toContain('id: z.string().uuid(),');
    expect(output).toContain('email: z.string(),'); 
    expect(output).toContain('age: z.number().optional(),');
    expect(output).toContain("role: z.enum(['admin', 'user', 'guest']).optional().default(\"user\"),");
    expect(output).toContain('createdAt: z.date(),');
  });

  it('should generate valid Mongoose schema', () => {
    const output = generateMongoose(mockSchema);
    expect(output).toContain('export const UserSchema = new Schema({');
    expect(output).not.toContain('id:'); // Primary id is skipped
    expect(output).toContain('email: { type: String, required: true, unique: true },');
    expect(output).toContain('age: { type: Number },');
    expect(output).toContain("role: { type: String, default: 'user', enum: ['admin', 'user', 'guest'] },");
  });

  it('should generate valid Postgres SQL', () => {
    const output = generatePostgres(mockSchema);
    expect(output).toContain('CREATE TABLE users (');
    expect(output).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
    expect(output).toContain('email VARCHAR NOT NULL UNIQUE');
    expect(output).toContain('age INTEGER');
    expect(output).toContain("role VARCHAR CHECK (role IN ('admin', 'user', 'guest')) DEFAULT 'user'");
    expect(output).toContain('created_at TIMESTAMP NOT NULL');
    expect(output).toContain('profile JSONB');
  });
});
