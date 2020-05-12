/*
 * Library for setting up server configurations for an environment
 */
var chalk = require('chalk');
const fs = require('fs');
var path = require('path');
var util = require('./utils');
var prompt = require('prompt-sync')();
var utils = require('shipit-utils');
const Q = require('q');
var trim = require('trim');

module.exports = function (shipit, config) {
    var module = {};
    utils.registerTask(shipit, 'setup:env:task', task);
    var shipit = utils.getShipit(shipit);

    function task() {
        return infoPrompt()
                .then(checkSSHKey)
                .then(checkSSHUser)
                .then(SSHAccess)
                .then(checkDeployTo);
    }

    /*
     * Prompts user for username and access to servers in the environment list
     */
    function infoPrompt() {
        // Prompt for username and password to access servers
        var username, password = null;
        var username = '';
        var password = '';
        shipit.config.servers.forEach(function (element) {
            username = util.promptDefault('Enter username for server ' + element.host, username);
            password = util.promptDefault('Enter password for server ' + element.host, password);

            element.user = username;
            element.pass = password;
        });

        return new Q();
    }

    /*
     * Create public/private SSH key for environment if it doesn't exist
     */
    function checkSSHKey() {
        shipit.log(chalk.white('Checking if public and private SSH keys exist'));
        var pathPrivate = path.join(config.directory.keys, shipit.config.remote.sshKeyName);
        var pathPublic = path.join(config.directory.keys, shipit.config.remote.sshKeyName + '.pub');

        if (util.keyFileExists(pathPrivate) && util.keyFileExists(pathPublic)) {
            shipit.log(chalk.green('Keys exist'));
        } else {
            shipit.log(chalk.yellow('Keys do not exist. Creating public and private keys...'));

            // Try to delete both keys incase only one exists
            if (fs.existsSync(pathPrivate))
                fs.unlinkSync(pathPrivate);
            if (fs.existsSync(pathPublic))
                fs.unlinkSync(pathPublic);

            // Create keys
            var password = prompt('Enter password to encrypt key files with: ');
            util.createKeyFile(pathPrivate, password);

            shipit.log(chalk.green('Key files created'));
        }
        return new Q();
    }

    /*
     * Create SSH user on each server. create if it doesn't exist
     */
    function checkSSHUser() {
        shipit.log(chalk.white('Checking if SSH user ' + shipit.config.remote.sshDeployAccount + ' exists'));
        return util.remote(shipit, 'id -u ' + shipit.config.remote.sshDeployAccount)
            .then(function (res) {
                var servers = [];
                res.forEach(function (response) {
                    if (response.stdout[0] !== '' && !isNaN(response.stdout[0])) {
                        shipit.log(chalk.green(response.server.host + ': user exists'));
                    } else {
                        shipit.log(chalk.yellow(response.server.host + ': user does not exist. creating...'));
                        servers.push(response.server);
                    }
                });
                // Add user and add to www-data group
                if (servers.length > 0)
                    return util.remote(shipit, 'sudo adduser --disabled-password --gecos "" ' + shipit.config.remote.sshDeployAccount + ';sudo usermod -a -G www-data '+shipit.config.remote.sshDeployAccount, {}, servers);
            });
    }

    /*
     * Create default SSH directory
     * Configure cert authentication
     * Add github SSH credentials to id_rsa and id_rsa.pub
     */
    function SSHAccess() {
        shipit.log(chalk.white('Setting up SSH access for user ' + shipit.config.remote.sshDeployAccount));

        // Load keys
        var pathPublic = path.join(config.directory.keys, shipit.config.remote.sshKeyName + '.pub');
        var pathDeployKey = path.join(config.directory.keys, config.git.gitKeyName);
        var pathDeployKeyPub = path.join(config.directory.keys, config.git.gitKeyName + '.pub');
        if (util.keyFileExists(pathPublic) && util.keyFileExists(pathDeployKey) && util.keyFileExists(pathDeployKeyPub)) {
            var pubKey = trim(fs.readFileSync(pathPublic, {encoding: 'utf-8'}));
            var privateDeployKey = trim(fs.readFileSync(pathDeployKey, {encoding: 'utf-8'}));
            var pubDeployKey = trim(fs.readFileSync(pathDeployKeyPub, {encoding: 'utf-8'}));
        } else {
            console.log(chalk.red('One or more of these key files do not exist:'));
            console.log(chalk.red(pathPublic + '\n' + pathDeployKey + '\n' + pathDeployKeyPub + '\n' + 'Exiting...'));
            process.exit(1);
        }

        // Delete .ssh directory if it exists and generate default rsa files
        var cmdSSHGen = 'rm -r ~/.ssh; ssh-keygen -t rsa -N "" -f ~/.ssh/id_rsa;';
        // Create authorized_keys and and user's public key
        var cmdAuth = 'touch ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys;echo "' + pubKey + '" > ~/.ssh/authorized_keys;';
        // Overwrite id_rsa and id_rsa.pub with GitHub deploy keys
        var cmdGit = 'echo "' + privateDeployKey + '" > ~/.ssh/id_rsa;echo "' + pubDeployKey + '" > ~/.ssh/id_rsa.pub;';
        return util.remote(shipit, cmdSSHGen + cmdAuth + cmdGit, {cwd: '~', user: shipit.config.remote.sshDeployAccount});

    }

    /*
     * Create deploy to directory if not already created
     */
    function checkDeployTo() {
        shipit.log(chalk.white('Checking if webroot directory exists: ' + shipit.config.deploy.webRoot));
        return util.remote(shipit, 'test -e ' + shipit.config.deploy.webRoot + ' && echo "1" || echo "0"')
            .then(function (res) {
                var servers = [];
                res.forEach(function (response) {
                    if (response.stdout[0] == true) {
                        shipit.log(chalk.green(response.server.host + ': webroot exists'));
                    } else {
                        shipit.log(chalk.yellow(response.server.host + ': webroot does not exist. creating...'));
                        servers.push(response.server);
                    }
                });
                if (servers.length > 0) {
                    console.log(servers);
                    var cmd = 'sudo mkdir ' + shipit.config.deploy.webRoot + ';sudo chmod -R ' + shipit.config.deploy.webRootPermission + ' ' + shipit.config.deploy.webRoot + ';sudo chown -R ' + shipit.config.remote.sshDeployAccount + ':www-data ' + shipit.config.deploy.webRoot;
                    return util.remote(shipit, cmd, servers);
                }
            });
    }

    /*
     * Check and add Apache config
     */
    function apacheConfig() {
        shipit.log(chalk.white('Setting up Apache configuration file'));
        var localConfigPath = path.join(shipit.config.deploy.apacheLocalConfigPath, shipit.config.deploy.apacheConfigFile);
        var remoteConfigPath = path.join(shipit.config.deploy.apacheConfigRoot, shipit.config.deploy.apacheConfigFile);

        // Check if apache config exists
        if (!fs.existsSync(localConfigPath)) {
            shipit.log(chalk.red('Local Apache configuration file ' + localConfigPath + ' does not exist. Exiting...'));
            process.exit(1);
        }

        // Upload file to home directory
//        util.uploadFile(shipit, {local:localConfigPath,remote:remoteConfigPath},'644');

        // Check if remote config exists
//        return util.remote(shipit, 'test -e ' + remoteConfigPath + ' && echo "1" || echo "0"')
        return util.remote(shipit, 'test -e ' + remoteConfigPath + ' && echo "1" || echo "0"')
            .then(function (res) {
                console.log(res);
//                    util.uploadFile(shipit, [])
//                            .then(function (response) {
//                                console.log(response);
//                            });
            });
    }


    return module;
};