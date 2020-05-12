var chalk = require('chalk');
const fs = require('fs');
var path = require('path');
var trim = require('trim');
var util = require('../utils');
var prompt = require('prompt-sync')();

module.exports = function (config) {
    var module = {};
    var gitapi = require('./gitapi')(config);

    module.setupKey = function () {
        getGitHubCredentials();
        createKey();
        deployKey();
    };

    function getGitHubCredentials() {
        var username = prompt('Enter GitHub username: ');
        config.git.username = username;
        var token = prompt('Enter GitHub token: ');
        config.git.token = token;
    }

    /*
     * Creates a new ssh key for git if it doesn't exist
     */
    function createKey() {
        console.log(chalk.green('Checking if public and private key GitHub deploy keys exist'));
        var pathPrivate = path.join(config.directory.keys, config.git.gitKeyName);
        var pathPublic = path.join(config.directory.keys, config.git.gitKeyName + '.pub');

        // If one of the keys does not exist then create keys
        if (!util.keyFileExists(pathPrivate) || !util.keyFileExists(pathPublic)) {
            console.log(chalk.green('Creating public and private keys because both key files do not exist'));
            // Try to delete both keys incase only one exists
            if (fs.existsSync(pathPrivate))
                fs.unlinkSync(pathPrivate);
            if (fs.existsSync(pathPublic))
                fs.unlinkSync(pathPublic);

            // Create keys
            var password = prompt('Enter password to encrypt key files with: ');
            util.createKeyFile(pathPrivate, password);
        } else {
            console.log(chalk.green('Key files exist'));
        }

        return;
    }

    /*
     * Add key to GitHub repository if it doesn't exist
     */
    function deployKey() {
        // Get deploy keys in GitHub and try to match to local public key
        console.log(chalk.green('Checking if local public key matches a deploy key in GitHub'));
        var pubKey = trim(fs.readFileSync(path.join(config.directory.keys, config.git.gitKeyName + '.pub'), {encoding: 'utf-8'}));
        var keys = gitapi.listDeployKeys();
        
        var match = false;
        keys.forEach(function (key) {
            if (key.key === pubKey) {
                match = key.key;
                console.log(chalk.green('Deploy key found'));
            }
        });

        // If match is false then we need to add the local public key as a deploy key to the repository
        if (!match) {
            console.log(chalk.yellow('Deploy key not found in GitHub. Adding...'));
            var res = gitapi.addDeployKey(config.git.deployKeyTitle, pubKey, true);
            if (res.statusCode == 201) {
                console.log(chalk.green('Deploy key successfully added'));
            } else {
                console.log(chalk.red('Unable to add deploy key. Exiting...'));
                process.exit(1);
            }
        }

        return;
    }

    return module;
};