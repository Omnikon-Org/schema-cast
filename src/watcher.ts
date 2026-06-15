import chokidar from 'chokidar';
import { processSchemaFile, processDirectory } from './orchestrator';
import * as fs from 'fs';

export function watchSchemas(input: string, outDir?: string) {
  console.log(`Watching for schema changes in: ${input}`);
  
  const watcher = chokidar.watch(input, {
    persistent: true,
    ignoreInitial: false
  });

  watcher
    .on('add', path => {
      if (isSchemaFile(path)) {
        console.log(`File added: ${path}`);
        tryProcess(path, outDir);
      }
    })
    .on('change', path => {
      if (isSchemaFile(path)) {
        console.log(`File changed: ${path}`);
        tryProcess(path, outDir);
      }
    })
    .on('unlink', path => {
      if (isSchemaFile(path)) {
        console.log(`File removed: ${path}`);
        // Optionally, remove generated files here if desired.
        // For simplicity, we just log it in this initial version.
      }
    });
}

function isSchemaFile(path: string): boolean {
  return path.endsWith('.schema.json') || path.endsWith('.schema.yaml') || path.endsWith('.schema.yml');
}

function tryProcess(path: string, outDir?: string) {
  try {
    processSchemaFile(path, outDir);
  } catch (error: any) {
    console.error(`Error processing ${path}:`, error.message);
  }
}
