var gulp       = require('gulp');
var gulpif     = require('gulp-if');
var del        = require('del');
var minimist   = require('minimist');
var requireDir = require('require-dir');

requireDir('./gulp');

// Load config
var pkg  = require('./package.json');

// Load arguments from terminal
var args = minimist(process.argv.slice(2));

// Polyfill ES6 promises
// require('es6-promise').polyfill();

// Comment banner
var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @author <%= pkg.author.name %> (<%= pkg.author.email %>)',
    ' */',
    ''].join('\n');

gulp.task('build', ['sass']);

gulp.task('default', ['build']);
