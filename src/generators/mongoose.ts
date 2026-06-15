import { SchemaDefinition, FieldDefinition } from '../types';

export function generateMongoose(schema: SchemaDefinition): string {
  const lines: string[] = [];
  lines.push(`import { Schema } from 'mongoose';\n`);
  lines.push(`export const ${schema.name}Schema = new Schema({`);

  for (const field of schema.fields) {
    // Skip 'id' if it's primary, as MongoDB uses '_id' by default
    if (field.primary && field.name === 'id') {
      continue;
    }
    lines.push(generateField(field, '  '));
  }

  lines.push(`});\n`);
  return lines.join('\n');
}

function generateField(field: FieldDefinition, indent: string): string {
  if (field.type === 'object') {
    const lines = [`${indent}${field.name}: {`];
    const nextIndent = indent + '  ';
    for (const f of (field as any).fields) {
      lines.push(generateField(f as FieldDefinition, nextIndent));
    }
    lines.push(`${indent}},`);
    return lines.join('\n');
  }

  const props: string[] = [];
  
  if (field.type === 'array') {
    if ((field as any).items.type === 'object') {
      const lines = [`type: [{`];
      const nextIndent = indent + '  ';
      for (const f of (field as any).items.fields) {
        lines.push(generateField(f as FieldDefinition, nextIndent));
      }
      lines.push(`${indent}}]`);
      // Since it spans multiple lines, we can't easily join it with commas on a single line.
      // We will assemble this specific case differently.
      return `${indent}${field.name}: {\n${indent}  type: [{\n${(field as any).items.fields.map((f: any) => generateField(f as FieldDefinition, indent + '    ')).join('\n')}\n${indent}  }]\n${indent}},`;
    } else {
      const typeStr = getPrimitiveType((field as any).items.type);
      props.push(`type: [${typeStr}]`);
    }
  } else {
    props.push(`type: ${getPrimitiveType(field.type)}`);
  }

  if (field.required) props.push(`required: true`);
  if (field.unique) props.push(`unique: true`);
  
  if ('default' in field && field.default !== undefined) {
    if (typeof field.default === 'string') {
      props.push(`default: '${field.default}'`);
    } else {
      props.push(`default: ${field.default}`);
    }
  }

  if (field.type === 'enum') {
    const vals = (field as any).values.map((v: string) => `'${v}'`).join(', ');
    props.push(`enum: [${vals}]`);
  }

  return `${indent}${field.name}: { ${props.join(', ')} },`;
}

function getPrimitiveType(type: string): string {
  switch (type) {
    case 'string':
    case 'uuid':
    case 'email':
    case 'url':
    case 'enum':
      return 'String';
    case 'number': return 'Number';
    case 'boolean': return 'Boolean';
    case 'date': return 'Date';
    default: return 'Schema.Types.Mixed';
  }
}
