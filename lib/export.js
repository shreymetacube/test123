var utils = require('shipit-utils');
var chalk = require('chalk');
var path = require('path');
var util = require('./utils');
var dateFormat = require('dateformat');
const c = require('child_process');
const Q = require('q');

module.exports = function (shipit, config) {
    utils.registerTask(shipit, 'export:task', task);
    var shipit = utils.getShipit(shipit);
    var backupDir = null;

    function task() {
        // Set export folder name Environment_YYYY_MM_DD_Timestamps
        shipit.config.export.localDirName = shipit.environment + '-' + dateFormat(new Date(), "yyyy_mm_dd_HH_MM_ss");
        backupDir = path.join(shipit.config.export.localDir, shipit.config.export.localDirName);

        return exportDirectories()
            .then(exportDatabase);
    }

    /*
     * Function that exports an array of directories to the local machine
     */
    function exportDirectories() {
        console.log('Exporting directories to ' + backupDir);

        // Make backup directory for files
        c.execSync('mkdir -p ' + path.join(backupDir, shipit.config.export.exportDirFiles));

        // Sync each directory in export list
        shipit.config.export.exportDir.forEach(function (element) {
            // Set remote and local paths for the directory
            var remotePath = path.join(shipit.config.deploy.webRoot, element);
            var localPath = path.join(backupDir, shipit.config.export.exportDirFiles, path.dirname(element));

            // Create local path
            c.execSync('mkdir -p ' + localPath);

            // Create exclude dirs
            var excludeDirs = '';
            shipit.config.export.exportDirExclude.forEach(function (dir) {
                if (element === dir.exportDir) {
                    excludeDirs += ' --exclude="' + path.join(dir.exclude, '*') + '" ';
                }
            });

            // Create rsync command
            var cmd = 'rsync -chavzP --timeout=6000 --copy-dirlinks --stats ' + excludeDirs + ' -e "ssh -i ' + shipit.config.key + '" ' + shipit.config.servers[0].user + '@' + shipit.config.servers[0].host + ':' + remotePath + ' ' + localPath;
            console.log(cmd);

            // Execute rsync command
            c.execSync(cmd, {stdio: [0, 1, 2]});
        });

        console.log(chalk.green('Finished exporting directories to ' + backupDir));

        return new Q();
    }

    /*
     * Exports the MySQL database using drush sql-dump command
     */
    function exportDatabase() {
        console.log('Exporting database... this may take some time.');

        // Create SSH command to use drush sql-dump to export database to local path
        // ssh -l user remoteserver "drush sql-dump" > /localpath/localfile.sql.gz
        var cmd = 'ssh -i ' + shipit.config.key + ' ' + shipit.config.servers[0].user + '@' + shipit.config.servers[0].host + ' \'' + util.remoteCMD('drush sql-dump', {cwd: shipit.config.deploy.webRoot, drush: true}) + '\' > ' + path.join(backupDir, shipit.config.export.exportDBName);
        c.execSync(cmd);
        console.log(chalk.green('Finished exporting database to ' + backupDir));
        return new Q();
    }

    return module;
};