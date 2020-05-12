var utils = require('shipit-utils');
var chalk = require('chalk');
var path = require('path');
var util = require('./utils');
var dateFormat = require('dateformat');
const c = require('child_process');
var inquirer = require('inquirer');
const Q = require('q');

module.exports = function (shipit, config) {
    utils.registerTask(shipit, 'import:task', task);
    var shipit = utils.getShipit(shipit);
    var backupDir = null;

    function task() {
        // Set local backup directory

        return promptDirectory()
            .then(importDirectories)
            .then(importDatabase);
    }

    /*
     * Prompt for backup directory to import
     */
    function promptDirectory() {
        return inquirer.prompt({
            name: 'backup',
            type: 'list',
            message: 'Select backup to import',
            choices: util.getDirectories(shipit.config.export.localDir)
        }).then(function (ans) {
            backupDir = path.join(shipit.config.export.localDir, ans.backup);
        });
    }

    /*
     * Import directories into the webroot
     */
    function importDirectories() {
        console.log(backupDir);
        console.log('Importing directories to ' + shipit.environment);

        // Sync each directory in export list
        shipit.config.export.exportDir.forEach(function (element) {
            // Set local and remote filespaths
            var localPath = path.join(backupDir, shipit.config.export.exportDirFiles, element, '/');
            var remotePath = path.join(shipit.config.deploy.webRoot, element, '/');

            // Build rsync command for each directory and make sure path exists
            var cmd = 'rsync -q --rsync-path="mkdir -p ' + remotePath + ' && rsync" -chvzPr -O --no-perms --no-owner --no-group --stats ' + localPath + ' -e "ssh -i ' + shipit.config.key + '" ' + shipit.config.servers[0].user + '@' + shipit.config.servers[0].host + ':' + remotePath;
            
            // Execute rsync command
            c.execSync(cmd, {stdio: [0, 1, 2]});
        });

        return new Q();
    }

    /*
     * Import database into remote database
     */
    function importDatabase() {
        console.log('Importing database to ' + shipit.environment);

        // Upload backup to workspace on remote server 1
        util.uploadFile(shipit, {remote: '~/dump.sql', local: path.join(backupDir, shipit.config.export.exportDBName)}, '700', [shipit.config.servers[0]]);

        // Import backup into database
        console.log('Starting importing of database. This may take a while...');
        var cmd = 'drush sql-cli < ~/dump.sql; rm ~/dump.sql;';
        return util.remote(shipit, cmd, {cwd: shipit.config.deploy.webRoot, drush: true}, [shipit.config.servers[0]])
            .then(function (res) {
                console.log('Finished importing database to ' + shipit.environment);
            });
    }

    return module;
};