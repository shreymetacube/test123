var utils = require('shipit-utils');
var chalk = require('chalk');
var path = require('path');
var util = require('../utils');
const Q = require('q');

module.exports = function (shipit, config) {
    utils.registerTask(shipit, 'deploy:sync', task);
    var shipit = utils.getShipit(shipit);

    function task() {
        return sync()
            .then(createLinks)
            .then(updateSettings)
            .then(composerUpdate)
            .then(updateScript);
    }

    /*
     * Sync files from repo to web root
     */
    function sync() {
        // Build rsync command
        // Src has trailing slash so we copy content and not root directory
        var src = path.join(shipit.config.deploy.workspaceRepo, shipit.config.deploy.publicDirRepo) + '/';
        var dest = shipit.config.deploy.webRoot;

        var includeDirs = '';
        shipit.config.deploy.includeDir.forEach(function (dir) {
            includeDirs += ' --include="' + dir + '" ';
        });

        var excludeDirs = '';
        shipit.config.deploy.excludeDir.forEach(function (dir) {
            excludeDirs += ' --exclude="' + path.join(dir, '*') + '" ';
        });

        /*
         * The rsync command will include specific subdirectories from excluded directories if specified in config.
         * The example below would include var/classes and var/config, but not any other directory in var
         */
        //rsync --archive --delete  --include="/website/var/classes/" --include="/website/var/config/" --exclude="/website/var/*/" ~/repository/application/ /var/www/html/test

        var cmd = 'rsync -rlptoD --delete ' + includeDirs + ' ' + excludeDirs + ' ' + src + ' ' + dest;
        console.log(chalk.green('Syncing web files with command: '));
        console.log(cmd);

        return util.remote(shipit, cmd)
            .then(function (res) {
                shipit.log(chalk.green('Directory synced'));
                
                var cmd_perm = 'chgrp -R www-data ' + shipit.config.deploy.webRoot;
                return util.remote(shipit, cmd_perm)
                    .then(function (res) {
                        shipit.log(chalk.green('Web group updated'));
                    });
            });
    }

    /*
     * Create any symbolic links defined in config file
     */
    function createLinks() {
        if (typeof shipit.config.deploy.symbolicLinks !== "undefined") {
            shipit.log(chalk.green('Creating symbolic links:'));

            var cmd = '';
            shipit.config.deploy.symbolicLinks.forEach(function (link) {
                var symbolic = path.join(shipit.config.deploy.webRoot, link.symbolic);
                console.log(symbolic + ' => ' + link.source);
                cmd += 'mkdir -p ' + link.source + ';ln -sfn ' + link.source + ' ' + symbolic + ';';
            });

            if (cmd !== '') {
                return util.remote(shipit, cmd)
                    .then(function (res) {
                        shipit.log(chalk.green('Symbolic links created'));
                    });
            } else {
                return;
            }
        }
    }

    /*
     * Update settings.php file for environment
     */
    function updateSettings() {
        if (config.deploy.updateSettingsFiles) {
            console.log('Updating environment specific setting files.');
            var filepath = shipit.config.deploy.settingsFile.local;
            var remoteFilepath = path.join(shipit.config.deploy.webRoot, shipit.config.deploy.settingsFile.remote);
            // Check if settings file exists locally
            if (util.fileExists(filepath)) {
                console.log('Settings file exists at ' + filepath);
                // Upload files
                util.uploadFile(shipit, {local: filepath, remote: remoteFilepath}, '444');

            } else {
                console.log(chalk.red('Settings file does not exist at ' + filepath));
            }
        }

        return new Q();
    }

    /*
     * Install composer updates
     */
    function composerUpdate() {
        console.log('Attempting to run composer install --no-dev --no-interaction. This may take a while...');
        return util.remote(shipit, 'composer install --no-dev --no-interaction', {cwd: shipit.config.deploy.webRoot, streamOutput: true})
            .then(function (res) {
                shipit.log(chalk.green('Finished running composer'));
            });
    }

    /*
     * Update Apache configuration file and upload ssl certs
     */
    function updateApache() {
        if (config.deploy.updateApache) {
            console.log('Updating Apache configuration file.');
            var localFilepath = shipit.config.deploy.apacheConfigFile.local;
            var remoteFilepath = shipit.config.deploy.apacheConfigFile.remote;

            if (util.fileExists(filepath)) {
                console.log('Settings file exists at ' + filepath);
                // Upload files
                util.uploadFile(shipit, {local: filepath, remote: remoteFilepath}, '444');

            } else {
                console.log(chalk.red('Settings file does not exist at ' + filepath));
            }

        }
    }

    /*
     * Run the Drupal update script on web server 1
     */
    function updateScript() {
        console.log('Running the Drupal update script.');
        return util.remote(shipit, 'chmod 744 update.sh; ./update.sh; chmod 644 update.sh', {cwd: shipit.config.deploy.webRoot, streamOutput: true, drush: true}, [shipit.config.servers[0]])
            .then(function (res) {
                shipit.log(chalk.green('Finished running composer'));
            });
    }

    return module;
};

