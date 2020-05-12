module.exports = function (config) {
    var module = {};

    module.getConfig = function () {

        var conf = {
            default: {
                /*
                 * Filepath to the SSH key for the environment
                 * To be implemented for each environment in local config
                 * key: 'resources/keys/effen@stage',
                 */
                key: '',
                /*
                 *  An array of servers in the environment
                 *  To be implemented for each environment in the local config
                 *  servers: [
                 *      {
                 *          host: (Required)'<host name>',
                 *          user: (Required)'effen',
                 *          port: (Optional) <port #> Defaults to 22 if not specified
                 *      }
                 *  ]
                 */
                servers: [],
                remote: {
                    // The filename for the SSH key for the environment
                    sshKeyName: '',
                    // The username for deploying sites on a server
                    sshDeployAccount: '',
                },
                deploy: {
                    // The web root path for the environment
                    webRoot: '',

                    // Version of drush
                    drushVersion: '8.1.12',
                    // Permission for webroot of site
                    webRootPermission: '755',
                    // Default Apache path
                    apacheRoot: '/etc/apache2/',
                    // Default Apache config path
                    apacheConfigRoot: '/etc/apache2/sites-available',
                    // Default Apache ssl path for certificates
                    apacheSSLRoot: '/etc/apache2/ssl',
                    // Default Apache local config file directory
                    apacheLocalConfigPath: './resources/provisioning/config/',

                    // Directory for working Git repository
                    workspaceRepo: '~/repository',
                    // Directory in the project to sync web files from
                    publicDirRepo: 'application',
                    // An array of relative paths to specifically include when syncing a site from git
                    includeDir: [
                        'core/vendor'
                    ],
                    // An array of relative paths to specifically exclude when syncing a site from git. Note: if 'includeDir' contains a subdirectory on an excludeDir path it will be included.
                    excludeDir: [
                        'sites/default',
                        '/vendor'
                    ],
                    /*
                     * An array of relative symbolic links that need to be created 
                     * [
                     *  {symbolic: 'sites/default/files', source: '/mnt/vodkas/effen/files'}
                     * ]
                     */
                    symbolicLinks: [],
                    /*
                     * An object for the settings file specific to an environment with local(local path to file) and remote(remote path to file on server
                     * {local: 'resources/config/stage.settings.php', remote: 'sites/default/settings.php'}
                     */
                    settingsFile: {},
                },
                export: {
                    // Local directory to put backups
                    localDir: 'resources/backups',
                    // Relative directory to keep any file backups in
                    exportDirFiles: 'files',
                    // MySQL dump file name
                    exportDBName: 'dump.sql',
                    // An array of directories in the webroot to export
                    exportDir: [
                        'sites/default/files'
                    ],
                    /*
                     * An array of directories to exclude from an export.
                     *  exportDir: This should match a record for the exportDir config setting
                     *  exlucde: This is the directory to exclude from the exportDir
                     */
                    exportDirExclude: [
                        {exportDir: 'sites/default/files', exclude: 'php', },
                        {exportDir: 'sites/default/files', exclude: 'styles', }
                    ]
                }
            },
            dev: {},
            stage: {},
            prod: {}
        };
        return conf;
    };

    return module;
};