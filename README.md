# Drupal Management
NPM package containing functions for managing Drupal automated processes for brand sites.

## Other Documentation
[Release Processes](https://github.com/BeamSuntoryInc/drupal-management/blob/master/RELEASES.md)

## Add to Project
The package should be included by default in sites built from the drupal skeleton repository. If not, you can install via yarn with this command.
~~~
yarn add git+ssh://git@github.com:BeamSuntoryInc/drupal-management.git
~~~

## Configurations
There are global and environment specific configurations that are required to be made before some of the command will work with this solution.

Create a file in the root directory of the project named 'config.js' and modify the appropriate settings:
~~~
var config = {
    // Environment configurations
    env: {},
    // Directory configurations
    directory: {},
    // Git settings
    git: {},
    // Custom webpack configuration
    webpack: null,
    // Shipit configuration
    shipit: {},
    // Export configuration
    export: {},
    // Import configuration
    import: {}
        }
    }
};
module.exports.config = config;
~~~
### Environment Configuration
Required override: None
~~~
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
	// Global config for build script
        build:{
            // Config for clearing drupal cache
            cache: false,
			// Config for splitting each library specified in Drupal module's libraries.yml file
            splitLibrary: false
        }
},
~~~
### Directory Configuration
Require override: None
~~~
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
}
~~~
### GitHub Configuration
Required override:
* repositoryUrl
* repository
~~~
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
}
~~~

### Shipit Configuration

~~~
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
	remote:{
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
	     * An array of directories to exclude from an export.
	     *  exportDir: This should match a record for the exportDir config setting
	     *  exlucde: This is the directory to exclude from the exportDir
	     */
	    exportDirExclude: [
		{exportDir: 'sites/default/files', exclude: 'php', },
		{exportDir: 'sites/default/files', exclude: 'styles', }
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
	    ]
	}
	},
	dev: {},
	stage: {},
	prod: {}
~~~


## Commands
### Build Code
Command to build the front end code of the site.
~~~
gulp build [--module <module name>, --minify, --cache]

Arguments
--module <module name>
	Optional 
	If present, only the specify module will be built.

--minify
	Optional
	If present the front end code will be minified.
--cache
	Optional
	If present the Drupal cache will be cleared after building the module(s).
--sl
    Optional - If present, webpack will split each library in the drupal module's libraries.yml file into separate files. If not present, only main.js will be built.
~~~
### Build Code Release
Command to build and commit a full release of the code. It will run webpack with minify enabled, create and tag a git version and push to the git repository.
~~~
gulp release

Arguments
--noBuild
	Optional
	If present, the release task will not build each module.
~~~
### GitHub Deploy Key
Command to create a GitHub deploy key for the current repository (if it does not exist) and encrypts the file for the project.
~~~
gulp git:key

Prompts
	GitHub username: <Enter your GitHub username>
	GitHub token: <Enter your GitHub token>
~~~
### Environment Setup
Configures the web servers in an environment for the site:
* Creates a public/private RSA key for a deploy account
* Creates a deploy account on the web servers
* Configures SSH key access to the web servers for the deploy account
* Creates the web root directory for the site
~~~
gulp setup [--env <environment name>, --bypassEnvConfirm]

Prompts
	Username: SSH username for each server in the environment
	Password: SSH password for each server in the environment
Arguments
	--env <stage,prod, or other defined> 
		Required
		Enter the name of the environment being set up
	--bypassEnvConfirm
                Optional
                If present, environment confirm prompt will not prompt
~~~	
### Deploy Setup
Configures base settings for deploying a site to an environment.
* Creates a Git workspace directory
* Initializes the Git repository on each web server
* Configures the Git remote repository
* Add GitHub as known host
~~~
gulp setup:deploy [--env <environment name>, --bypassEnvConfirm]

Prompts
	None
Arguments
	--env <stage,prod, or other defined> 
		Required
		Enter the name of the environment being set up
        --bypassEnvConfirm
                Optional
                If present, environment confirm prompt will not prompt
~~~
### Deploy
Deploys the site from GitHub to all servers in an environment
* Export a backup of the site to the local computer
* Fetch the version of the site to deploy to each web server
* Syncs the files to the web root
* Creates any symbolic links
* Attempts to install any composer updates
* Runs the Drupal update.sh script
~~~
gulp deploy [--env <environment name>, --updateSettings, --bypassEnvConfirm]

Prompts
	Tag: Select the tag from GitHub repository to deploy
Arguments
	--env <stage,prod, or other defined> 
		Required
		Enter the name of the environment being set up
	--bypassEnvConfirm
		Optional
		If present, environment confirm prompt will not prompt
	--updateSettings
		Optional
		If present, the environment specific setting files (settings.php) will be uploaded
	--noExport
		Optional
		If present, an export will not be taken when deploying code
~~~
### Export
Exports files and database dump from an environment to the local system.
~~~
gulp export [--env <environment name>, --bypassEnvConfirm]

Prompts
	None
Arguments
	--env <stage,prod, or other defined> 
		Required
		Enter the name of the environment being set up
	--bypassEnvConfirm
		Optional
		If present, environment confirm prompt will not prompt
~~~
### Import
Imports flies and database dump to an environment.
~~~
gulp import [--env <environment name>, --bypassEnvConfirm]

Prompts
	None
Arguments
	--env <stage,prod, or other defined> 
		Required
		Enter the name of the environment being set up
	--bypassEnvConfirm
		Optional
		If present, environment confirm prompt will not prompt
~~~
### Encrypt
Encrypts a local file.
~~~
gulp encrypt [--f <filepath>]

Prompts
	Password: The password to encrypt the file with
Arguments
	--f <filepath>
		Required
		The filepath of the file to encrypt
~~~
### Decrypt
Decrypts a local file.
~~~
gulp decrypt [--f <filepath>]

Prompts
	Password: The password to decrypt the file with
Arguments
	--f <filepath>
		Required
		The filepath of the file to decrypt
~~~
	
## Miscellaneous
### Check the version of package installed
~~~
cd /vagrant
yarn list --depth=0 | grep 'drupal-management'
~~~
### Development Process
Follow these steps to extend the drupal management package.
1. Stand up local development environment for a Drupal site
1. Remove the current drupal-management package
	~~~
	cd /vagrant
	yarn remove drupal-management
	~~~
1. Clone repository for development
	~~~
	cd /vagrant
	git clone git@github.com:BeamSuntoryInc/drupal-management.git
	~~~
1. Install [Yalc](https://github.com/whitecolor/yalc)
	~~~
	cd /vagrant
	yarn global add yalc
	~~~
1. Configure dependency with local files
	~~~
	cd /vagrant/drupal-management
	yalc publish
	cd /vagrant
	yalc add drupal-management --link
	yarn install
	~~~
1. Development
	* Make changes to files in /vagrant/drupal-management
	* Publish changes locally with yalc
		~~~
		cd /vagrant/drupal-management
		yalc publish --push
		~~~
1. Modify README.md if applicable and bump version in package.json file
1. Add, commmit, push git as normally
1. Tag git repository to new version that matches package.json
