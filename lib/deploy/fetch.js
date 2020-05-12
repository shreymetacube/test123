var utils = require('shipit-utils');
var chalk = require('chalk');
var inquirer = require('inquirer');
const splitLines = require('split-lines');
var util = require('../utils');

module.exports = function(shipit, config) {
    utils.registerTask(shipit, 'deploy:fetch', task);
    var shipit = utils.getShipit(shipit);
    var gitapi = require('../git/gitapi')(config);
    var tag = null;

    function task() {
        return fetch()
            .then(promptTags)
            .then(checkout);
    }

    /*
     * Fetch repository
     */
    function fetch() {
        shipit.log('Fetching remote repository');
        return util.remote(shipit, 'git fetch --all --tags --prune;', { cwd: shipit.config.deploy.workspaceRepo });
    }

    /*
     * Prompt for tag to deploy and confirm
     */
    function promptTags() {
        var tags = util.formatGithubTags(gitapi.getTags());

        return inquirer.prompt({
            name: 'tag',
            type: 'list',
            message: 'Select tag to deploy',
            choices: tags
        }).then(function(answers) {
            tag = answers.tag;
        }).then(function() {
            return inquirer.prompt({
                name: 'confirm',
                type: 'confirm',
                default: false,
                message: 'Are you sure you want to deploy ' + tag + ' to ' + config.env.environment + '?',
            }).then(function(ans) {
                if (ans.confirm) {
                    console.log('Deploying ' + tag + ' to ' + config.env.environment);
                } else {
                    console.log(chalk.red('User selected to not deploy ' + tag + ' to ' + config.env.environment + '. Exiting...'));
                    process.exit(1);
                }
            });
        });


        // return util.remote(shipit, 'git tag', {cwd: shipit.config.deploy.workspaceRepo})
        //     .then(function (response) {
        //         var tags = splitLines(response[0].stdout.toString());
        //         tags = tags.filter(function (val) {
        //             return val !== '';
        //         }).reverse().slice(0,50);

        //         return inquirer.prompt({
        //             name: 'tag',
        //             type: 'list',
        //             message: 'Select tag to deploy',
        //             choices: tags
        //         }).then(function (answers) {
        //             tag = answers.tag;
        //         }).then(function () {
        //             return inquirer.prompt({
        //                 name: 'confirm',
        //                 type: 'confirm',
        //                 default: false,
        //                 message: 'Are you sure you want to deploy ' + tag + ' to ' + config.env.environment + '?',
        //             }).then(function (ans) {
        //                 if (ans.confirm) {
        //                     console.log('Deploying ' + tag + ' to ' + config.env.environment);
        //                 } else {
        //                     console.log(chalk.red('User selected to not deploy ' + tag + ' to ' + config.env.environment + '. Exiting...'));
        //                     process.exit(1);
        //                 }
        //             });
        //         });
        //     });
    }


    /*
     * Checkout the specified tag
     */
    function checkout() {
        if (tag === null) {
            console.log(chalk.red('Tag was not specified. Exiting...'));
            process.exit(1);
        } else {
            console.log('Checking out tag ' + tag);
        }

        return util.remote(shipit, 'git checkout ' + tag, { cwd: shipit.config.deploy.workspaceRepo }).then(function(res) {
            res.forEach(function(response) {
                console.log(chalk.whiteBright(response.server.host));
                console.log(response.stdout);
            });
        });
    }
};