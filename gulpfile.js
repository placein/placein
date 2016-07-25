// TODO: finish local server
// TODO: add jshintrc
// TODO: fix changelog
// TODO: javascript tests

/*
 *-----------------------------------------------------------------------------
 * Init
 *-----------------------------------------------------------------------------
 */
// Load packages
var gulp          = require('gulp');
var gulpif        = require('gulp-if');
var del           = require('del');
var jshintStylish = require('jshint-stylish');
var minimist      = require('minimist');
var p             = require('gulp-load-plugins')({ replaceString: /\bgulp[\-.]/ });

// Load config
var pkg  = require('./package.json');
var o    = require('./build/config.json');

// Load arguments from terminal
var args = minimist(process.argv.slice(2));

// Browser sync
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// Polyfill ES6 promises
require('es6-promise').polyfill();

// Comment banner
var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @author <%= pkg.author.name %> (<%= pkg.author.email %>)',
    ' */',
    ''].join('\n');

/*
 *-----------------------------------------------------------------------------
 * CSS
 *-----------------------------------------------------------------------------
 * Compile and minify scss files to CSS.
 * Plugins used: scss-lint - sass - sourcemaps - autoprefixer- combine-media-queries - strip-css-comments - csso - rename - cached - stylestats
 */
gulp.task('scss-lint', function () {
    return gulp.src(o.sass.input + '*.scss')
        .pipe(p.cached('scssLint'))
        .pipe(p.scssLint({
            'config': o.sass.linter,
            'reporterOutput': o.sass.lintReport,
        }));
});

gulp.task('scss-compile', function () {
    return gulp.src(o.sass.input + '*.scss')
        .pipe(p.sourcemaps.init())
        .pipe(p.sass({
            errLogToConsole: o.sass.log,
        }).on('error', p.sass.logError))
        .pipe(p.autoprefixer(o.sass.support))
        .pipe(gulpif(o.sass.sourcemaps, p.sourcemaps.write()))
        .pipe(p.header(banner, { pkg : pkg }))
        .pipe(gulp.dest(o.sass.output));
});

gulp.task('scss-minify', function () {
    return gulp.src([o.sass.output + '*.css', '!' + o.sass.output + '*.min.css'])
        //.pipe(p.combineMediaQueries())
        .pipe(p.stripCssComments({
            preserve: false
        }))
        .pipe(p.csso())
        .pipe(p.rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(o.sass.output));
});

gulp.task('css-stats', function () {
    return gulp.src(o.sass.output + '*.min.css')
        .pipe(p.stylestats({
            type: 'json',
            outfile: true,
        }))
        .pipe(gulp.dest(o.sass.styleStats));
});

/*
 *-----------------------------------------------------------------------------
 * Javascript
 *-----------------------------------------------------------------------------
 * Compile and minify Javascript files
 * Plugins used: include - strip-debug - uglify - rename - iife (immediately invoked function expression)
 */

gulp.task('js-hint', function() {
    gulp.src(o.js.input + '**/*.js')
        .pipe(p.jshint())
        .pipe(p.jshint.reporter(jshintStylish))
        .pipe(gulpif(o.js.jshintFail, p.jshint.reporter('fail')));
});

gulp.task('js-compile', function() {
    gulp.src(o.js.input + '*.js')
        .pipe(p.include({
            hardFail: true,
        })).on('error', console.log)
        .pipe(p.iife())
        .pipe(p.header(banner, { pkg : pkg }))
        .pipe(gulp.dest(o.js.output));
});

gulp.task('js-minify', function() {
    gulp.src([o.js.input + '*.js', '!' + o.js.input + '*.min.js'])
        .pipe(p.rename({
            suffix: '.min'
        }))
        .pipe(p.stripDebug())
        .pipe(p.uglify())
        .pipe(gulp.dest(o.js.output));
});

/*
 *-----------------------------------------------------------------------------
 * Images
 *-----------------------------------------------------------------------------
 * Minify images
 * Plugins used: imagemin
 */
 gulp.task('img-optimize', function () {
     return gulp.src(o.img.input + '**/*.{png,gif,jpg,svg}')
        .pipe(p.cached('imagemin'))
        .pipe(p.imagemin({
            progressive: true,
            verbose: o.img.log
        }))
        .pipe(gulp.dest(o.img.output));
 });

/*
 *-----------------------------------------------------------------------------
 * Fonts
 *-----------------------------------------------------------------------------
 * Copy fonts to public folder
 */
gulp.task('copy-fonts', function () {
    return gulp.src(o.fonts.input + '**/*.{ttf,woff,eof,svg}')
        .pipe(gulp.dest(o.fonts.output));
});

gulp.task('serve', function() {
    browserSync({
        server: {
            baseDir: 'public'
        }
    });

    gulp.watch(['*.html', 'resources/**/*.css', 'resources/**/*.js'], {cwd: 'app'}, reload);
});

/*
 *-----------------------------------------------------------------------------
 * Release
 *-----------------------------------------------------------------------------
 * Write changelog
 */
// gulp.task('changelog', function () {
//     return gulp.src('CHANGELOG.md', {
//             buffer: false
//         })
//         .pipe(p.conventionalChangelog({
//             preset: 'angular' // Or to any other commit message convention you use.
//         }))
//         .pipe(gulp.dest('./'));
// });

gulp.task('bump-version', function () {
    var type = args.t || o.release.defaultType;
    return gulp.src(['./package.json'])
        .pipe(p.bump({type: type}).on('error', console.log))
        .pipe(gulp.dest('./'));
});

gulp.task('git-commit', function () {
    var message = args.m || o.release.defaultMessage;
    return gulp.src('.')
        .pipe(p.git.add())
        .pipe(p.git.commit(message));
});

gulp.task('git-push', function (callback) {
    p.git.push('origin', 'master', callback);
});

gulp.task('git-pull', function () {
    p.git.pull('origin', 'master', {}, function (err) {
        if (err) throw err;
    });
});

/*
 *-----------------------------------------------------------------------------
 * Reports
 *-----------------------------------------------------------------------------
 * Write a TODO.md
 */
gulp.task('todo', function () {
    return gulp.src(o.todo.input + '**/*.js')
        .pipe(p.todo())
        .pipe(gulp.dest(o.todo.output));
});

/*
 *-----------------------------------------------------------------------------
 * Notify
 *-----------------------------------------------------------------------------
 * Display a desktop notification
 */
gulp.task('notify-scss', function () {
     return gulp.src('').pipe(p.notify(o.messages.sass));
});

gulp.task('notify-js', function () {
     return gulp.src('').pipe(p.notify(o.messages.js));
});

gulp.task('notify-img', function () {
     return gulp.src('').pipe(p.notify(o.messages.img));
});

gulp.task('notify-reports', function () {
     return gulp.src('').pipe(p.notify(o.messages.reports));
});

gulp.task('notify-watch', function () {
     return gulp.src('').pipe(p.notify(o.messages.watch));
});

gulp.task('notify-commit', function () {
     return gulp.src('').pipe(p.notify(o.messages.commit));
});

/*
 *-----------------------------------------------------------------------------
 * Clean
 *-----------------------------------------------------------------------------
 * Delete all public assets
 */
gulp.task('clean', function () {
    return del([o.global.assetsDir]);
});

/*
 *-----------------------------------------------------------------------------
 * Watch
 *-----------------------------------------------------------------------------
 */
gulp.task('watch', function () {
    gulp.watch(o.sass.input + '**/*.scss', ['notify-watch', 'css']);
    gulp.watch(o.js.input + '**/*.js', ['notify-watch', 'js']);
    gulp.watch(o.img.input + '**/*.{png,gif,jpg,svg}', ['notify-watch', 'img']);
});

/*
 *--------------------------------------------------------------------------
 * Task bundles
 *--------------------------------------------------------------------------
 */
gulp.task('start', function () {
    p.runSequence('git-pull', 'default');
});

gulp.task('css', function () {
    p.runSequence('scss-lint', 'scss-compile', 'scss-minify', 'notify-scss');
});

gulp.task('js', function () {
    p.runSequence('js-hint', 'js-compile', 'js-minify', 'notify-js');
});

gulp.task('img', function () {
    p.runSequence('img-optimize', 'notify-img');
});

gulp.task('commit', function () {
    p.runSequence('bump-version',/* 'changelog',*/ 'git-commit', 'git-push', 'notify-commit');
});

gulp.task('reports', function () {
    p.runSequence('css-stats', 'todo');
});

gulp.task('default', ['css', 'js', 'img']);
