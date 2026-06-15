import * as yaml from 'js-yaml';
import { SchemaDefinition } from './types';
import * as fs from 'fs';
import * as path from 'path';

export function parseSchemaString(content: string, format: 'json' | 'yaml'): SchemaDefinition {
  let parsed: any;
  if (format === 'json') {
    parsed = JSON.parse(content);
  } else {
    parsed = yaml.load(content);
  }

  // Basic validation
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Schema must be an object');
  }
  if (typeof parsed.name !== 'string') {
    throw new Error('Schema must have a valid string "name"');
  }
  if (!Array.isArray(parsed.fields)) {
    throw new Error('Schema must have an array of "fields"');
  }

  return parsed as SchemaDefinition;
}

export function parseSchemaFile(filePath: string): SchemaDefinition {
  const ext = path.extname(filePath).toLowerCase();
  const format = ext === '.yaml' || ext === '.yml' ? 'yaml' : 'json';
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseSchemaString(content, format);
}
