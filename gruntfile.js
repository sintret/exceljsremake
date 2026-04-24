'use strict';

module.exports = function(grunt) {
  const esbuild = require('esbuild');

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('esbuild', 'Bundle browser builds using esbuild', function() {
    const done = this.async();

    const banner = `/*! ExcelJS ${grunt.template.today('dd-mm-yyyy')} */\n`;

    async function buildPair({ entry, outBase }) {
      await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        format: 'iife',
        globalName: 'ExcelJS',
        sourcemap: true,
        banner: { js: banner },
        outfile: `./dist/${outBase}.js`,
        platform: 'browser',
        target: ['es2018'],
      });

      await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        format: 'iife',
        globalName: 'ExcelJS',
        sourcemap: true,
        minify: true,
        banner: { js: banner },
        outfile: `./dist/${outBase}.min.js`,
        platform: 'browser',
        target: ['es2018'],
      });
    }

    (async () => {
      await buildPair({ entry: './lib/exceljs.browser.js', outBase: 'exceljs' });
      await buildPair({ entry: './lib/exceljs.bare.js', outBase: 'exceljs.bare' });

      await esbuild.build({
        entryPoints: ['./build/spec/browser/exceljs.spec.js'],
        bundle: true,
        format: 'iife',
        sourcemap: true,
        outfile: './build/web/exceljs.spec.js',
        platform: 'browser',
        target: ['es2018'],
      });
    })()
      .then(() => done())
      .catch((err) => {
        grunt.log.error(err);
        done(false);
      });
  });

  grunt.initConfig({
    babel: {
      options: {
        sourceMap: true,
        compact: false,
      },
      dist: {
        files: [
          {
            expand: true,
            src: ['./lib/**/*.js', './spec/browser/*.js'],
            dest: './build/',
          },
        ],
      },
    },

    copy: {
      dist: {
        files: [
          {expand: true, src: ['**'], cwd: './build/lib', dest: './dist/es5'},
          {src: './build/lib/exceljs.nodejs.js', dest: './dist/es5/index.js'},
          {src: './LICENSE', dest: './dist/LICENSE'},
        ],
      },
    },

    jasmine: {
      options: {
        version: '3.8.0',
        noSandbox: true,
        tempDir: 'grunt-contrib-jasmine-tmp',
        allowFileAccess: true,
      },
      dev: {
        src: ['./dist/exceljs.js'],
        options: {
          specs: './build/web/exceljs.spec.js',
        },
      },
    },
  });

  grunt.registerTask('build', ['babel:dist', 'esbuild', 'copy']);
};
