#!/usr/bin/env node
import { Command } from 'commander';
import { processSchemaFile, processDirectory } from './orchestrator';
import { watchSchemas } from './watcher';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('schema-bridge')
  .description('Generate TypeScript, Zod, Mongoose, and PostgreSQL from single schema definition.')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate code from schema files')
  .option('-i, --input <path>', 'Input schema file or directory')
  .option('-o, --out <path>', 'Output directory (defaults to input directory)')
  .option('-a, --all', 'Process all schema files in the input directory')
  .action((options) => {
    if (!options.input) {
      console.error('Error: --input <path> is required');
      process.exit(1);
    }
    
    const inputPath = path.resolve(process.cwd(), options.input);
    const outDir = options.out ? path.resolve(process.cwd(), options.out) : undefined;

    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Path does not exist - ${inputPath}`);
      process.exit(1);
    }

    const stat = fs.statSync(inputPath);
    if (options.all || stat.isDirectory()) {
      if (!stat.isDirectory()) {
        console.error(`Error: --input must be a directory when using --all`);
        process.exit(1);
      }
      processDirectory(inputPath, outDir);
    } else {
      processSchemaFile(inputPath, outDir);
    }
  });

program
  .command('watch')
  .description('Watch for schema file changes and regenerate automatically')
  .option('-i, --input <path>', 'Input directory to watch')
  .option('-o, --out <path>', 'Output directory (defaults to input directory)')
  .action((options) => {
    if (!options.input) {
      console.error('Error: --input <path> is required');
      process.exit(1);
    }
    const inputPath = path.resolve(process.cwd(), options.input);
    const outDir = options.out ? path.resolve(process.cwd(), options.out) : undefined;
    
    if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isDirectory()) {
      console.error(`Error: --input must be a valid directory for watching`);
      process.exit(1);
    }

    watchSchemas(inputPath, outDir);
  });

program.parse(process.argv);
