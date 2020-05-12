# Drupal Management - Initial Releases
Process for the initial deployment of a new site to an environment. Usually will be from local development to stage.

## Overview
Steps to go from a local copy of the project to deploying to stage.
1.  Create a GitHub deployment key for the project
1.  Configure local development environment for import/export
1.  Drupal settings.php configuration
1.  Prepare project for Git repository
1.  Create GitHub release
1.  Prepare remote environment for deployment
1.  Deploy code to remote environment
1.  Import content from local backup to remote environment

## GitHub Deploy Key
* Modify the config.js file git section and add the 'repositoryUrl' and 'repository' variables.
* Run the deploy key command: https://github.com/BeamSuntoryInc/drupal-management#github-deploy-key
~~~
cd /vagrant
gulp git:key
~~~

## Local Development Setup
This steps sets up the local development environment to be ready for importing and exporting the site. 
* Modify config.js file and add default and dev variables as needed to the shipit section.
* Run the environment setup for the dev environment: https://github.com/BeamSuntoryInc/drupal-management#environment-setup
~~~
cd /vagrant
gulp setup --env dev
~~~
* Run the deploy setup script on the dev environment: https://github.com/BeamSuntoryInc/drupal-management#deploy-setup
~~~
cd /vagrant
gulp setup:deploy --env dev
~~~
## Drupal Settings
The settings.php file is not stored in GitHub as it contains sensitive information. To account for this, each environment will have a specific copy of settings.php in the directory resources/config that is encrypted.
* Copy settings.php from the local Drupal site to resources/config and name it <environment>.settings.php.
* Modify the settings file to have any configurations specific to the environment the file is for. Such as database connections and other items unique to the environment.
* Plaintext settings files are ignore from Git so the file must be encrypted. Run this command to encrypt the file and save the password: https://github.com/BeamSuntoryInc/drupal-management#encrypt
~~~
cd /vagrant
gulp encrypt --f <path to file>
~~~
* There should be a new file created with the same name with a .gpg extension.
## Prepare For Git Repository
The Drupal site configuration must be exported manually before we commit the code to Git. The config is used when deploying a release to another environment as it is imported.
* Run the drush command to export config
~~~
cd /var/www/html
drush cex -y config
~~~
* You should see a successful export to the application/config directory
## Build Release
* Commit code to the remote repository for Github to master or local branch. Whatever makes sense for the site.
* If this is the initial build release set the 'version' value in composer.json to '0.1.0' otherwise ignore this step.
* Build a code release: https://github.com/BeamSuntoryInc/drupal-management#build-code-release
~~~
cd /vagrant
gulp release
~~~
* The release should be built, committed to Github, tagged, and pushed to the repository.
## Environment Setup
These steps must be taken when a site is first being launched to an environment.
* Create database for the site by replacing database name and user account below.
~~~
CREATE DATABASE <database> CHARACTER SET utf8 COLLATE utf8_general_ci;
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE, SHOW VIEW, CREATE, ALTER, REFERENCES, INDEX, CREATE VIEW, CREATE ROUTINE, ALTER ROUTINE, EVENT, DROP, TRIGGER, CREATE TEMPORARY TABLES, LOCK TABLES ON <database>.* TO '<username>'@'%' IDENTIFIED BY '<password>';
~~~
* Configure the config.js shipit variable for default and the environment the site is being deployed to.
* Set up a deployment account and some basic configuration settings on web servers in environment. Run the setup script: https://github.com/BeamSuntoryInc/drupal-management#environment-setup
~~~
gulp setup --env stage
~~~
*note*: if key SSH key files do not exist they will automatically be created when the script is ran. Please commit and push to the Github repo.
* Configure base settings/configurations for Github deployments on the web servers. Run script: https://github.com/BeamSuntoryInc/drupal-management#deploy-setup
~~~
gulp setup:deploy --env stage
~~~
* Configure Apache configurations and SSL certificates on web servers
## Deploy Code
Code is selected by tag version when it is deployed to an environment. Run this script and select the tag to deploy: https://github.com/BeamSuntoryInc/drupal-management#deploy
~~~
gulp deploy --env stage --updateSettings
~~~
*note*: if this is the first time the site is being deployed there will be some error related to not having a database. We must run this before import because symbolic links need to be created. After a successful import run the deploy command again.
## Export & Import
If the site is being launched to a new environment, there needs to be an export/import of the database/files from another environment (usually dev to stage or stage to prod) before the site can be deployed.
* Make sure config.js variables are set up for export/import for the specific environment.
* Run the command to export data from dev in this case: https://github.com/BeamSuntoryInc/drupal-management#export
~~~
gulp export --env dev
~~~
*note*: you will see a directory created with the current timestamp in the resources/backups folder on the local drive.
* Run the command to import the export just created into the new environment: https://github.com/BeamSuntoryInc/drupal-management#import
~~~
gulp import --env stage
~~~

# Drupal Management - Subsequent Releases
Once the development environment has been established and the environment being deployed to has been setup and has an initial deployment, follows these steps for subsequent code deployments.

## Overview
Steps to go from a local copy of the project to deploying to stage.
1.  Make code, configs, and any other changes to the code base in the development environment
1.  [Build modules(s)](https://github.com/BeamSuntoryInc/drupal-management#build-code), [export config](https://github.com/BeamSuntoryInc/drupal-management/blob/master/RELEASES.md#prepare-for-git-repository), [encrypt settings.php](https://github.com/BeamSuntoryInc/drupal-management/blob/master/RELEASES.md#drupal-settings), or any other tasks necessary to ensure all code files are update to date
1.  [Build a new release](https://github.com/BeamSuntoryInc/drupal-management/blob/master/RELEASES.md#build-release)
1.  [Deploy release](https://github.com/BeamSuntoryInc/drupal-management/blob/master/README.md#deploy)


