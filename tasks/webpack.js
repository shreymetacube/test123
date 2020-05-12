const fs = require('fs');
var webpack = require('webpack');
const chalk = require('chalk');
var webpackStream = require('webpack-stream');
var folders = require('gulp-folders');
var gutil = require('gulp-util');
var merge = require('deepmerge');
const c = require('child_process');
var path = require('path');

// Included for JS ES6 minification workaround
var gulpif = require('gulp-if');
const filter = require('gulp-filter');
var uglifyjs = require('uglify-es');
var composer = require('gulp-uglify/composer');
var minify = composer(uglifyjs, console);

module.exports = function (config) {
    var wpconfig = require('../config/webpack.config.js')(config);
    var gulp = config.gulp;
    var sequence = require('gulp-sequence').use(gulp);

    /*
     * Initialization checks
     */
    gulp.task('webpack:init', function () {
    });

    /*
     * Runs webpack on all custom modules
     */
    gulp.task('webpack:bundle', folders(config.directory.modules, function (folder) {
        if (config.env.buildModules && (config.env.module === null || config.env.module === folder)) {
            // Get default config and merge with modifications from project
            var conf = wpconfig.getConfig(folder);

            if (conf !== false) {
                var conf = merge.all([conf, config]);
            }

            if (conf !== false && fs.existsSync(conf.directory.entry)) {
                // Workaround for minifying JS ES6
                const jsFilter = filter(['**/*.js'], {restore: true});

                return gulp.src('')
                        .pipe(webpackStream(conf.webpack, webpack))
                        .on('end', function () {
                            gutil.log(chalk.blueBright('Start module: ' + folder));
                        })
                        .pipe(jsFilter)
                        .pipe(gulpif(config.env.minify, minify({})))
                        .pipe(jsFilter.restore)
                        .pipe(gulp.dest(conf.directory.moduleDistDir))
                        .on('end', function () {
                            gutil.log(chalk.blueBright('End module: ' + folder));
                        });
            } else {
                return gulp.src('');
            }
        } else {
            return gulp.src('');
        }
    }));
    
    /*
     * Checks if cache should be cleared
     */
    gulp.task('webpack:cache', function () {
        // Clear cache if set
        if(config.env.build.cache){
            console.log('Clearing Drupal cache in '+config.directory.devWebRoot);
            c.execSync('drush cr',{cwd:path.join(config.directory.devWebRoot),stdio: [0, 1, 2]});
        }
    });

    gulp.task('webpack', sequence('webpack:init', 'webpack:bundle','webpack:cache'));

};




