"use strict";

var merge = require('deepmerge');

module.exports = function(config) {
    var gulp = config.gulp;
    var sequence = require('gulp-sequence').use(gulp);

    // Merge default config with user provided
    var defaultConfig = require('../config/config');
    config = merge.all([defaultConfig.config, config]);

    // Merge default shipit config with user provided config
    var shipconf = require('../config/shipit.config')(config);
    config.shipit = merge.all([shipconf.getConfig(), config.shipit]);

    require('./init')(config);
    require('./webpack')(config);
    require('./version')(config);
    require('./git')(config);
    require('./setup')(config);
    require('./export')(config);
    require('./import')(config);
    require('./encrypt')(config);
    require('../lib/deploy/index')(config);

    /**
     * Default task that runs webpack
     * @param --minify
     *  Optional - Minifies the JavaScript and CSS files if present
     * @param --module <module name>
     *  Optional - Builds only the specified module otherwise builds all modules
     * @param --cache
     *  Optional - If present the Drupal cache will be cleared after building the module(s).
     * @param --sl
     *  Optional - If present, webpack will split each library in the drupal modules' libraries.yml file into separate files. If not present, only main.js will be built.
     */
    gulp.task('build', sequence('init', 'init:build', 'webpack'));

    /*
     * Release task. Builds a complete release
     *  Runs webpack
     *  Creates git version
     *  Pushes and tags to git repo
     *  @param --noBuild
     *   Optional - If present, the release task will not build each module
     */
    gulp.task('release', sequence('init', 'init:release', 'webpack', 'version', 'git:release' ));

    /*
     * Setup GitHub deploy key
     *  Prompts
     *      GitHub username: <Enter your GitHub username>
     *      GitHub token: <Enter your GitHub token>
     */
    gulp.task('git:key', sequence('init', 'git:setkey'));

    /*
     * Configures web servers in an environment
     * --env <stage,prod>
     * --bypassEnvConfirm
     *  Optional
     *  If present, environment confirm prompt will not prompt
     */
    gulp.task('setup', sequence('init:env', 'setup:env'));

    /*
     * Configures base settings for deploying a site
     * --env <stage,prod>
     * --bypassEnvConfirm
     *  Optional
     *  If present, environment confirm prompt will not prompt
     */
    gulp.task('setup:deploy', sequence('init:env', 'deploy:init'));

    /*
     * Deploys the site from GitHub to all servers in an environment
     * --env <stage,prod>
     *  Required.
     * --updateSettings
     *  Optional.
     *  If present, the environment specific setting(s) files will be uploaded
     * --updateApache
     *  Optional.
     *  If present, the apache configuratio file and ssl certs will be uploaded and reloaded
     *  --noExport
     *  Optional
     *  If present, an export will not be taken when deploying code
     *  --bypassEnvConfirm
     *  Optional
     *  If present, environment confirm prompt will not prompt
     */
    gulp.task('deploy', sequence('init:env', 'init:deploy', 'export', 'deploy:site'));

    /*
     * Exports files/dbs from an environment
     * --env <stage,prod>
     * --bypassEnvConfirm
     *  Optional
     *  If present, environment confirm prompt will not prompt
     */
    gulp.task('export', sequence('init:env', 'export:site'));

    /*
     * Imports files/dbs from an export to an environment
     * --env <stage,prod>
     * --bypassEnvConfirm
     *  Optional
     *  If present, environment confirm prompt will not prompt
     */
    gulp.task('import', sequence('init:env', 'import:site'));

    /*
     * Encrypt a file
     *  --f filepath
     */
    gulp.task('encrypt', sequence('init:encrypt', 'encrypt:file'));

    /*
     * Decrypt a file
     *  --f filepath
     */
    gulp.task('decrypt', sequence('init:encrypt', 'encrypt:decrypt'))

};




/*
 * Backup task. Creates a backup of files/database to local drive
 *  -e  (Required): Environment (dev,stage,prod)
 */
//gulp.task('export', sequence(['init', 'shipit:backup']));

/*
 * Import task
 *  -e  (Required): Environment (dev,stage,prod)
 */
//gulp.task('import', sequence(['init', 'shipit:import']));

/*
 * Deploy task
 *  -e  (Required): Environment (dev,stage,prod)
 */
//gulp.task('deploy', sequence(['init', 'shipit:deploy']));

/*
 * Setup task
 *  -e  (Required): Environment (dev,stage,prod)
 */
//gulp.task('setup', sequence(['init', 'shipit:setup']));