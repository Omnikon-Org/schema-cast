import { SchemaDefinition, FieldDefinition } from '../types';

export function generateTypeScript(schema: SchemaDefinition): string {
  const lines: string[] = [];
  lines.push(`export interface ${schema.name} {`);

  for (const field of schema.fields) {
    lines.push(generateField(field, '  '));
  }

  lines.push(`}\n`);
  return lines.join('\n');
}

function generateField(field: FieldDefinition, indent: string): string {
  const optionalMark = field.required ? '' : '?';
  const typeStr = getFieldType(field, indent);
  return `${indent}${field.name}${optionalMark}: ${typeStr};`;
}

function getFieldType(field: Omit<FieldDefinition, 'name'>, indent: string): string {
  switch (field.type) {
    case 'string':
    case 'uuid':
    case 'email':
    case 'url':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'Date';
    case 'enum':
      return (field as any).values.map((v: string) => `'${v}'`).join(' | ');
    case 'object': {
      const lines = ['{'];
      const nextIndent = indent + '  ';
      for (const f of (field as any).fields) {
        lines.push(generateField(f as FieldDefinition, nextIndent));
      }
      lines.push(`${indent}}`);
      return lines.join('\n');
    }
    case 'array': {
      const items = (field as any).items;
      const itemType = getFieldType(items, indent);
      if (items.type === 'object' || items.type === 'enum') {
        return `Array<${itemType.trim()}>`;
      }
      return `${itemType}[]`;
    }
    default:
      return 'any';
  }
}
