import { SchemaDefinition, FieldDefinition } from '../types';
import pluralize from 'pluralize';

export function generatePostgres(schema: SchemaDefinition): string {
  const tableName = pluralize(schema.name).toLowerCase();
  const lines: string[] = [];
  lines.push(`CREATE TABLE ${tableName} (`);

  const fieldLines: string[] = [];
  for (const field of schema.fields) {
    fieldLines.push(generateField(field, '  '));
  }

  lines.push(fieldLines.join(',\n'));
  lines.push(`);\n`);
  return lines.join('\n');
}

function generateField(field: FieldDefinition, indent: string): string {
  const columnName = camelToSnakeCase(field.name);
  const typeStr = getPostgresType(field);
  
  const constraints: string[] = [];
  
  if (field.primary) constraints.push('PRIMARY KEY');
  if (field.type === 'uuid' && field.primary) constraints.push('DEFAULT gen_random_uuid()');
  if (field.required && !field.primary) constraints.push('NOT NULL');
  if (field.unique) constraints.push('UNIQUE');

  if (field.type === 'enum') {
    const vals = (field as any).values.map((v: string) => `'${v}'`).join(', ');
    constraints.push(`CHECK (${columnName} IN (${vals}))`);
  }
  
  if ('default' in field && field.default !== undefined && !field.primary) {
    if (typeof field.default === 'string') {
      constraints.push(`DEFAULT '${field.default}'`);
    } else {
      constraints.push(`DEFAULT ${field.default}`);
    }
  }

  const constraintStr = constraints.length > 0 ? ' ' + constraints.join(' ') : '';
  return `${indent}${columnName} ${typeStr}${constraintStr}`;
}

function getPostgresType(field: FieldDefinition): string {
  switch (field.type) {
    case 'string':
    case 'email':
    case 'url':
    case 'enum':
      return 'VARCHAR';
    case 'uuid':
      return 'UUID';
    case 'number':
      return 'INTEGER';
    case 'boolean':
      return 'BOOLEAN';
    case 'date':
      return 'TIMESTAMP';
    case 'object':
      return 'JSONB';
    case 'array':
      if ((field as any).items.type === 'object') {
        return 'JSONB';
      } else {
        return `${getPostgresType({ ...(field as any).items, name: '' } as any)}[]`;
      }
    default:
      return 'VARCHAR';
  }
}

function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
