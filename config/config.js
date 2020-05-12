/*
 * Default onfiguration settings for use with the Drupal-Management module
 */
var config = {
    // Environment configurations
    env: {
        // The names of the different environments
        environmentNames: ['dev', 'stage', 'prod'],
        // The names of different environment to double check when a command is ran against them
        environmentNamesCheck: ['stage', 'prod'],
        // If true the command has been confirmed to run on the environment
        environmentConfirmed: false,
        // The default environment scripts will use
        environment: 'dev',
        // Global config that is set in scripts for minifying files
        minify: false,
        // Global config that is set in script for building Drupal modules
        module: null,
        // Export task override. When false export is not allowed
        allowExport: true,
        // If true, releases will build all modules
        buildModules: true,
        // Global config for build script
        build:{
            // Config for clearing drupal cache
            cache: false,
            // Config for splitting each library specified in Drupal module's libraries.yml file
            splitLibrary: false
        }
    },
    // Directory configurations
    directory: {
        // Source directory for custom Drupal modules
        src: './src',
        // Distribution directory for custom Drupal modules
        dist: './dist',
        // Relative path for custom Drupal modules
        modules: './application/modules/custom',
        // Relative path for local dev webroot
        devWebRoot: '/var/www/html',
        // Directory where SSH keys are kept
        keys: './resources/keys',
        // Filename of Drupal module's libraries file
        libFilename: 'libraries.yml',
    },
    // Git settings
    git: {
        /* 
         * The URL of the GitHub repository for the site using the SSH protocol
         * repositoryUrl: 'git@github.com:BeamSuntoryInc/drupal-modules.git'
         */
        repositoryUrl: null,
        /*
         * The name of the GitHub repository
         * repository: 'drupal-modules'
         */
        repository: null,
        // The GitHub owner. This will almost always be the default value
        owner: 'BeamSuntoryInc',
        // The filename of the GitHub RSA deploy key
        gitKeyName: 'gitdeploy',
        // The deploy key name in GitHub
        deployKeyTitle: 'deploy key',
    },
    // Custom deployment settings
    deploy: {
        // Update settings files if set to true
        updateSettingsFiles: false,
    },
    // Custom webpack configuration
    webpack: null,
    // Shipit configuration
    shipit: {}
};
module.exports.config = config;