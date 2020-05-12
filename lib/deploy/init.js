var utils = require('shipit-utils');
var chalk = require('chalk');
var nr = require('newline-remove');
var execSync = require('child_process').execSync;
var util = require('../utils');

module.exports = function (shipit, config) {
    utils.registerTask(shipit, 'deploy:init:task:run', task);
    var shipit = utils.getShipit(shipit);

    function task() {
        return createWorkspace()
            .then(initRepository)
            .then(checkRemote)
            .then(gitHubKnownHost);
    }

    /*
     * Creates the remote repo workspace
     */
    function createWorkspace() {
        console.log(chalk.white('Creating Git workspace at ' + shipit.config.deploy.workspaceRepo));
        return util.remote(shipit, 'mkdir -p ' + shipit.config.deploy.workspaceRepo);
    }

    /*
     * Init the repo if not already
     */
    function initRepository() {
        console.log('Initialize remote repository in "%s"', shipit.config.deploy.workspaceRepo);
        return util.remote(shipit, 'git init', {cwd: shipit.config.deploy.workspaceRepo})
            .then(function (response) {
                console.log(chalk.green('Repository initialized.'));
            });
    }

    /*
     * Check if remote origin is set up
     */
    function checkRemote() {
        console.log('Checking remote repository.');
        return util.remote(shipit, 'git config --get remote.origin.url', {cwd: shipit.config.deploy.workspaceRepo})
            .then(function (res) {
                var servers = [];
                res.forEach(function (response) {
                    if (response.stdout[0] === config.git.repositoryUrl) {
                        console.log(chalk.green('Remote repository exists.'));
                    } else {
                        console.log(chalk.green('Adding remote repository ' + config.git.repositoryUrl));
                        servers.push(response.server);
                    }
                });
                // Add repository
                if (servers.length > 0)
                    return util.remote(shipit, 'git remote add origin ' + config.git.repositoryUrl, {cwd: shipit.config.deploy.workspaceRepo}, servers);
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