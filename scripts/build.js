/* eslint-disable no-console */
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const esbuild = require('esbuild');

function binPath(rootDir, binName) {
  const isWin = process.platform === 'win32';
  return path.join(rootDir, 'node_modules', '.bin', `${binName}${isWin ? '.cmd' : ''}`);
}

function run(command, args, opts = {}) {
  const isWin = process.platform === 'win32';
  if (isWin && command.toLowerCase().endsWith('.cmd')) {
    const quote = (a) => {
      if (a === '') return '""';
      if (!/[ \t"]/.test(a)) return a;
      return `"${a.replaceAll('"', '\\"')}"`;
    };
    const cmdLine = [quote(command), ...args.map(quote)].join(' ');
    execFileSync('cmd.exe', ['/d', '/s', '/c', cmdLine], { stdio: 'inherit', ...opts });
    return;
  }

  execFileSync(command, args, { stdio: 'inherit', ...opts });
}

async function copyRecursive(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  // Node 16+ supports fs.cp
  await fs.cp(src, dest, { recursive: true });
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const distDir = path.join(root, 'dist');
  const buildDir = path.join(root, 'build');
  const babelBin = binPath(root, 'babel');
  const fsShim = path.join(root, 'scripts/shims/fs.js');
  const cryptoShim = path.join(root, 'scripts/shims/crypto.js');
  const globalsShim = path.join(root, 'scripts/shims/globals.js');

  const nodeBuiltinsShimPlugin = {
    name: 'node-builtins-shim',
    setup(build) {
      build.onResolve({ filter: /^(fs|crypto|stream|util|process|buffer)$/ }, (args) => {
        if (args.path === 'fs') return { path: fsShim };
        if (args.path === 'crypto') return { path: cryptoShim };
        if (args.path === 'stream') return { path: require.resolve('stream-browserify') };
        if (args.path === 'util') return { path: require.resolve('util/') };
        if (args.path === 'process') return { path: require.resolve('process/browser') };
        if (args.path === 'buffer') return { path: require.resolve('buffer/') };
        return null;
      });
    },
  };

  await fs.rm(buildDir, { recursive: true, force: true });
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(buildDir, { recursive: true });
  await fs.mkdir(distDir, { recursive: true });

  // Transpile lib/ -> build/lib and spec/browser -> build/spec/browser
  run(babelBin, [
    'lib',
    '--out-dir',
    'build/lib',
    '--source-maps',
    '--extensions',
    '.js',
    '--copy-files',
  ], { cwd: root });

  run(babelBin, [
    'spec/browser',
    '--out-dir',
    'build/spec/browser',
    '--source-maps',
    '--extensions',
    '.js',
    '--copy-files',
  ], { cwd: root });

  const banner = `/*! ExcelJS ${new Date().toISOString().slice(0, 10)} */\n`;

  async function buildPair({ entry, outBase }) {
    await esbuild.build({
      entryPoints: [path.join(root, entry)],
      bundle: true,
      format: 'iife',
      globalName: 'ExcelJS',
      sourcemap: true,
      banner: { js: banner },
      footer: { js: 'globalThis.ExcelJS = ExcelJS;' },
      plugins: [nodeBuiltinsShimPlugin],
      inject: [globalsShim],
      outfile: path.join(distDir, `${outBase}.js`),
      platform: 'browser',
      target: ['es2018'],
    });

    await esbuild.build({
      entryPoints: [path.join(root, entry)],
      bundle: true,
      format: 'iife',
      globalName: 'ExcelJS',
      sourcemap: true,
      minify: true,
      banner: { js: banner },
      footer: { js: 'globalThis.ExcelJS = ExcelJS;' },
      plugins: [nodeBuiltinsShimPlugin],
      inject: [globalsShim],
      outfile: path.join(distDir, `${outBase}.min.js`),
      platform: 'browser',
      target: ['es2018'],
    });
  }

  await buildPair({ entry: 'lib/exceljs.browser.js', outBase: 'exceljs' });
  await buildPair({ entry: 'lib/exceljs.bare.js', outBase: 'exceljs.bare' });

  await esbuild.build({
    entryPoints: [path.join(buildDir, 'spec/browser/exceljs.spec.js')],
    bundle: true,
    format: 'iife',
    sourcemap: true,
    plugins: [nodeBuiltinsShimPlugin],
    inject: [globalsShim],
    outfile: path.join(buildDir, 'web/exceljs.spec.js'),
    platform: 'browser',
    target: ['es2018'],
  });

  // dist/es5
  await copyRecursive(path.join(buildDir, 'lib'), path.join(distDir, 'es5'));
  await fs.copyFile(
    path.join(buildDir, 'lib/exceljs.nodejs.js'),
    path.join(distDir, 'es5/index.js')
  );
  await fs.copyFile(path.join(root, 'LICENSE'), path.join(distDir, 'LICENSE'));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

