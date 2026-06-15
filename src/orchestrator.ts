import * as fs from 'fs';
import * as path from 'path';
import { parseSchemaFile } from './parser';
import { generateTypeScript } from './generators/typescript';
import { generateZod } from './generators/zod';
import { generateMongoose } from './generators/mongoose';
import { generatePostgres } from './generators/postgres';

export function processSchemaFile(filePath: string, outDir: string | undefined) {
  const schema = parseSchemaFile(filePath);
  const tsCode = generateTypeScript(schema);
  const zodCode = generateZod(schema);
  const mongooseCode = generateMongoose(schema);
  const pgCode = generatePostgres(schema);

  const baseName = path.basename(filePath).replace(/\.schema\.(json|yaml|yml)$/i, '');
  const dir = outDir || path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(path.join(dir, `${baseName}.types.ts`), tsCode);
  fs.writeFileSync(path.join(dir, `${baseName}.zod.ts`), zodCode);
  fs.writeFileSync(path.join(dir, `${baseName}.model.ts`), mongooseCode);
  fs.writeFileSync(path.join(dir, `${baseName}.sql`), pgCode);

  console.log(`Generated outputs for ${baseName} in ${dir}`);
}

export function processDirectory(dirPath: string, outDir: string | undefined) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath, outDir);
    } else if (file.endsWith('.schema.json') || file.endsWith('.schema.yaml') || file.endsWith('.schema.yml')) {
      processSchemaFile(fullPath, outDir);
    }
  }
}
