var argv = require('yargs').argv;
var chalk = require('chalk');
var fs = require('fs');
var prompt = require('prompt-sync')();

module.exports = function (config) {
    var gulp = config.gulp;
    /*
     * Initialize environment variables
     */
    gulp.task('init', function () {
        // Set minify options
        if (argv.minify) {
            config.env.minify = true;
        }
        if (argv.module) {
            config.env.module = argv.module;
        }

    });

    /*
     * set initialization variables for a build command
     */
    gulp.task('init:build', function () {
        // Set minify options
        if (argv.cache) {
            config.env.build.cache = true;
        }

        // Set libraries split options
        if(argv.sl){
            config.env.build.splitLibrary = true;
        }
    });

    /*
     * set initialization variables for a deploy command
     */
    gulp.task('init:deploy', function () {
        // Set minify options
        if (argv.noExport) {
            config.env.allowExport = false;
        }
    });

    /*
     * Set initialization variables for a release
     */
    gulp.task('init:release', function () {
        // Set minify to true
        config.env.minify = true;

        // Set no build options
        if (argv.noBuild) {
            config.env.buildModules = false;
        }
    });

    /*
     * Require environment option set and confirm command should be run for that environment
     */
    gulp.task('init:env', function () {
        // Check for environment variable
        if (argv.env) {
            if (config.env.environmentNames.includes(argv.env)) {
                config.env.environment = argv.env;
                // Check if confirmation is needed to run a command in this environment
                if (argv.bypassEnvConfirm) {
                    // Do not confirm running command in the environment
                    console.log('Proceeding');
                    config.env.environmentConfirmed = true;
                } else if (config.env.environmentNamesCheck.includes(argv.env) && !config.env.environmentConfirmed) {
                    // Confirm command to run in environment
                    var confirm = prompt('Are you sure you want to run the command in ' + argv.env + ' ? (y/n)').toLowerCase();
                    // Only run command if 'y' or 'yes' are entered
                    console.log(confirm);
                    if (confirm === 'y' || confirm === 'yes') {
                        console.log('Proceeding');
                        config.env.environmentConfirmed = true;
                    } else {
                        console.log(chalk.red('Command was cancelled. Exiting...'));
                        process.exit(1);
                    }

                }
            } else {
                console.log(chalk.red('Environment ' + argv.env + ' is not in the list of environment names:'));
                console.log(config.env.environmentNames);
                process.exit(1);
            }
        } else {
            console.log(chalk.red('Environment tag (--env) must be set to run command.'));
            process.exit(1);
        }

        // Check if updateSettings is present in arguments
        config.deploy.updateSettingsFiles = argv.updateSettings ? true : false;
        // Check if updateApache is present in arguments
        config.deploy.updateApache = argv.updateApache ? true : false;
    });

    /*
     * Require --f tag for filepath be present
     */
    gulp.task('init:encrypt', function () {
        if (argv.f) {
            if (!fs.existsSync(argv.f)) {
                console.log(chalk.red('Filepath (--f) ' + argv.f + ' does not exist.'));
                process.exit(1);
            } else {
                config.encryptFile = argv.f;
            }
        } else {
            console.log(chalk.red('Filepath tag (--f) must be set to run command.'));
            process.exit(1);
        }
    });
};
