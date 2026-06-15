import { SchemaDefinition, FieldDefinition } from '../types';

export function generateZod(schema: SchemaDefinition): string {
  const lines: string[] = [];
  lines.push(`import { z } from 'zod';\n`);
  lines.push(`export const ${schema.name}Schema = z.object({`);

  for (const field of schema.fields) {
    lines.push(generateField(field, '  '));
  }

  lines.push(`});\n`);
  return lines.join('\n');
}

function generateField(field: FieldDefinition, indent: string): string {
  const typeStr = getFieldType(field, indent);
  let chain = typeStr;
  
  if (!field.required) {
    chain += '.optional()';
  }
  if ('default' in field && field.default !== undefined) {
    chain += `.default(${JSON.stringify(field.default)})`;
  }

  return `${indent}${field.name}: ${chain},`;
}

function getFieldType(field: Omit<FieldDefinition, 'name'>, indent: string): string {
  switch (field.type) {
    case 'string': return 'z.string()';
    case 'uuid': return 'z.string().uuid()';
    case 'email': return 'z.string().email()';
    case 'url': return 'z.string().url()';
    case 'number': return 'z.number()';
    case 'boolean': return 'z.boolean()';
    case 'date': return 'z.date()';
    case 'enum': {
      const vals = (field as any).values.map((v: string) => `'${v}'`).join(', ');
      return `z.enum([${vals}])`;
    }
    case 'object': {
      const lines = ['z.object({'];
      const nextIndent = indent + '  ';
      for (const f of (field as any).fields) {
        lines.push(generateField(f as FieldDefinition, nextIndent));
      }
      lines.push(`${indent}})`);
      return lines.join('\n');
    }
    case 'array': {
      const itemType = getFieldType((field as any).items, indent);
      return `z.array(${itemType.trim()})`;
    }
    default:
      return 'z.any()';
  }
}
