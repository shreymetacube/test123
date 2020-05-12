var utils = require('shipit-utils');
var chalk = require('chalk');
var util = require('../utils');

module.exports = function (shipit, config) {
    utils.registerTask(shipit, 'deploy:checks', task);
    var shipit = utils.getShipit(shipit);

    function task() {
        return checkComposer()
            .then(checkDrush)
            .then(checkDrushVersion)
            .then(gitHubKnownHost);
    }

    /*
     * Check if composer is installed on all servers
     */
    function checkComposer() {
        console.log('Checking if composer is installed.');
        return util.remote(shipit, 'which composer')
            .then(function (res) {
                var servers = [];
                res.forEach(function (response) {
                    if (response.stdout.length === 0) {
                        console.log(chalk.red('Composer not installed: ' + response.server.host));
                        servers.push(response.server);
                    } else {
                        console.log(chalk.green('Composer installed: ' + response.server.host));
                    }
                });
                // Echo message to have composer installed before continuing
                if (servers.length > 0) {
                    console.log(chalk.red('One or more servers does not have composer installed. Please install composer before continuing.'));
                    process.exit(1);
                }
            });
    }

    /*
     * Check if Drush in installed and try to install
     */
    function checkDrush() {
        console.log('Checking if Drush is installed');
        if (!('drushVersion' in shipit.config.deploy)) {
            console.log(chalk.red('Drush version not defined at shipit.config.deploy.drushVersion. Exiting...'));
            process.exit(1);
        }
        return util.remote(shipit, 'which drush', {cwd: '~', drush: true})
            .then(function (res) {
                var servers = [];
                res.forEach(function (response) {
                    if (response.stdout.length === 0) {
                        console.log(chalk.red('Drush not installed: ' + response.server.host));
                        servers.push(response.server);
                    } else {
                        console.log(chalk.green('Drush installed: ' + response.server.host));
                    }
                });
                // Add repository
                if (servers.length > 0) {
                    console.log(chalk.red('Attempting to install Drush v' + shipit.config.deploy.drushVersion + 'on server(s):'));
                    servers.forEach(function (server) {
                        console.log(chalk.yellow(server.host));
                    });
                    // Install Drush version
                    return util.remote(shipit, 'composer require drush/drush:' + shipit.config.deploy.drushVersion + ';~/vendor/bin/drush -y init', {cwd: '~', streamOutput: true}, servers)
                }
            });
    }

    /*
     * Check version of Drush and try to configure if it doesn't match
     * {exitOnMismatch}: Optional, On true - don't attempt to change drush version
     */
    function checkDrushVersion(exitOnMismatch = false) {
        console.log('Checking if Drush version is correct');
        return util.remote(shipit, 'drush version --pipe', {cwd: '~', drush: true})
            .then(function (res) {
                var servers = [];
                res.forEach(function (response) {
                    if (response.stdout[0] === shipit.config.deploy.drushVersion) {
                        console.log(chalk.green(response.server.host + ': Drush installed version ' + response.stdout[0] + ' matches config version ' + shipit.config.deploy.drushVersion));
                    } else {
                        console.log(chalk.red(response.server.host + ': Drush installed version ' + response.stdout[0] + ' does not matche config version ' + shipit.config.deploy.drushVersion));
                        servers.push(response.server);
                    }
                });
                // Attempt to install correct Drush version
                if (servers.length > 0) {
                    // If any server do not have the correct version echo message and exit
                    if (exitOnMismatch) {
                        console.log(chalk.red('Unable to install the correct version of Drush automatically. Please install manually before continuing.'));
                        process.exit(1);
                    } else {
                        console.log(chalk.red('Attempting to install Drush v' + shipit.config.deploy.drushVersion + 'on server(s):'));
                        servers.forEach(function (server) {
                            console.log(chalk.yellow(server.host));
                        });
                        // Install Drush version
                        return util.remote(shipit, 'composer require drush/drush:' + shipit.config.deploy.drushVersion, {cwd: '~', streamOutput: true}, servers)
                            .then(function (res) {
                                return checkDrushVersion(true);
                            });
                    }
                }
            });
    }
    
    /*
     * Check if github.com is in known_hosts
     */
    function gitHubKnownHost() {
        shipit.log('Making sure github.com is in known_hosts');
        return util.remote(shipit, 'touch ~/.ssh/known_hosts;ssh-keygen -R github.com; ssh-keyscan -H github.com >> ~/.ssh/known_hosts', {cwd: '~'});
    }

};