var fs = require('fs');
const path = require('path');
var request = require('sync-request');
var prompt = require('prompt-sync')();
const execSync = require('child_process').execSync;
var keypair = require('keypair');
var forge = require('node-forge');
var trim = require('trim');
const Q = require('q');
var client = require('ssh2').Client;
var chalk = require('chalk');

module.exports = {
    getDirectories: function (srcpath) {
        return fs.readdirSync(srcpath)
            .filter(file => fs.statSync(path.join(srcpath, file)).isDirectory()).reverse()
    },

    /*
     *  Try to get github token from composer config otherwise prompts
     */
    getGithubToken(){
        // Try to get token if set
        var token = trim(execSync('composer config --global github-oauth.github.com').toString());
        return token;
    },

    /*
     *  Try to get github username from global setting
     *  git config --global user.name
     */
    getGithubUsername(){
        var username = trim(execSync('git config --global user.name').toString());
        return username;
    },

    /*
     *  Get tags from Github API and format correctly
     */
    formatGithubTags(tags){
        tags = tags.map(a => {
            var matches = a.ref.match(/[a-zA-Z0-9.-]+$/gm);
            return matches.length > 0 ? matches[0] : '';
        });
        return tags.reverse();
    },

    /*
     * Build remote command
     *  {command}:  The command(s) to run
     *  {options}:  cwd:            The current working directory
     *              ignoreErrors:   Ignore console errors
     *              user:           Runs command as this user using sudo -H -u <user> bash -c '<command>'
     *              drush:          Add $HOME/vendor/bin to PATH
     *              streamOutput:   Print out output from the console
     */
    remoteCMD: function (command, options = {}){

        var cmd = '';

        if ('cwd' in options) {
            cmd += this.cwd(options.cwd);
        }
        cmd += command;

        if ('user' in options) {
            cmd = "sudo -H -u " + options.user + " bash -c '" + cmd + "'";
        }

        if ('ignoreErrors' in options) {
            cmd += ' 2>/dev/null || :';
        }

        if ('drush' in options && options.drush === true) {
            cmd = 'export PATH="$PATH:$HOME/vendor/bin";' + cmd;
        }

        return cmd;
    },

    cwd: function (path) {
        return 'cd ' + path + '; ';
    },

    /*
     * Execute HTTPS GET request
     *  {options}: https://www.npmjs.com/package/sync-request
     *      url:    The URL path
     *  Returns a JSON object of the response or throws error
     */
    httpsGet: function (options) {
        var res = request('GET', options.url, options);
        return JSON.parse(res.getBody('utf8'));
    },

    /*
     * Execute HTTPS POST request
     * {options}: https://www.npmjs.com/package/sync-request
     *      url:    The URL path
     */
    httpsPost: function (options) {
        options.json = options.body;
        var res = request('POST', options.url, options);
        return res;
    },
    /*
     * Execute an ssh command
     *  {shipit}:   The shipit config object
     *  {command}:  The command to run
     *  {optinos}:  Command options
     *      streamOutput:   (true) outputs data to screen
     *      drush:          (true) will enable drush on the command line
     *  {servers}:   (Optional) Array of servers to run command on. If not specified then it will use all servers in shipit config.
     */
    remote: function (shipit, command, options = {}, servers = null) {
        return new Promise(function (res, err) {
            var complete_count = 0;
            var response = [];
            var servs = servers === null ? shipit.config.servers : servers;
            command = module.exports.remoteCMD(command, options);

            servs.forEach(function (server, index) {
                // Get User, Host, Port from format user@host:port. Port is optional
                var user = server.user;
                var host = server.host;
                var port = 'port' in server ? server.port : 22;
                var pass = server.pass;

                response.push({server: server, stdout: [], stderr: []});
                var conn = new client();
                conn.on('ready', function () {
                    conn.exec(command, {pty: true}, function (err, stream) {
                        if (err)
                            throw err;
                        stream.on('close', function (code, signal) {
                            conn.end();
                            complete_count++;
                            // Only return when all commands return
                            if (complete_count === servs.length) {
                                return res(response);
                            }
                        }).on('data', function (data) {
                            // Output data from server
                            if (options.streamOutput === true) {
                                console.log(chalk.blueBright(host + ':'));
                                console.log(data.toString());
                            }

                            if (data.toString().startsWith('[sudo] password')) {
                                stream.write(pass + '\n');
                            } else {
                                data = trim(data.toString());
                                if (data !== '') {
                                    response[index].stdout.push(data.toString());
                                }
                            }
                        }).stderr.on('data', function (data) {
                            data = trim(data.toString());
                            if (data !== '') {
                                response[index].stderr.push(data.toString());
                            }
                        });
                    });
                }).connect({
                    host: host,
                    port: port,
                    username: user,
                    password: pass,
                    readyTimeout: 99999,
                    // keepaliveInterval: 100,
                    // keepaliveCountMax: 20,
                    // readyTimeout: 600000,
                    privateKey: require('fs').readFileSync(shipit.config.key),
                });
            });
        });
    },

    /*
     * SFTP upload file
     * {shipit}:    A shipit object
     * {file}:      An object with local filepath and remote filepath {local:'<localpath>',remote:'<remotepath>'}
     * {permissions}:   Permissions to set file to ex: 777
     * {servers}:   Optional array of servers
     */
    uploadFile: function (shipit, file, permissions = '444', servers = null) {
            var complete_count = 0;
            var response = [];
            var servs = servers === null ? shipit.config.servers : servers;

            servs.forEach(function (server, index) {
                // Get User, Host, Port from format user@host:port. Port is optional
                var user = server.user;
                var host = server.host;
                var port = 'port' in server ? server.port : 22;
                var pass = 'pass' in server ? server.pass : false;
                var key = shipit.config.key;

                response.push({server: server, stdout: [], stderr: []});
                
                // Setting owner to have write access to file
                console.log('Setting permissions of 700 on file so owner can write' + file.remote);
                var sshCmd = module.exports.getSSH(key,server) + ' chmod -f 700 ' + file.remote + '  || :';
                execSync(sshCmd, {stdio:[0,1,2]});
                
                // scp -i ~/.ssh/id_rsa test_QA.log user@server:location 
                var cmd = 'scp -P ' + port + ' -i ' + key + ' ' + file.local + ' ' + user + '@' + host + ':' + file.remote;
                execSync(cmd, {stdio:[0,1,2]});
                
                // Set permissions on file
                console.log('Setting permissions of ' + permissions + ' on file ' + file.remote);
                var sshCmd = module.exports.getSSH(key,server) + ' "chmod ' + permissions + ' ' + file.remote + '"';
                execSync(sshCmd, {stdio:[0,1,2]});
                
            });
            

    },
    /*
     * Get a basic SSH command for a shipit server
     * {key}: A path to a key file
     * {server}: A shipit server object
     */
    getSSH: function(key, server){
        var port = 'port' in server ? server.port : 22;
        return 'ssh -p ' + port + ' -i '+ key + ' ' + server.user + '@' + server.host;
    },
    /*
     * GPG encrypt a file
     * {fileIn}:        The full path to input file
     * {password}:    The password to encrypt the file with
     */
    encryptFile: function (fileIn, password) {
        execSync('gpg --yes --batch -c --passphrase=' + password + ' ' + fileIn);
    },
    /*
     * GPG decrypt a file
     * {fileIn}:        The full path to input file
     * {password}:      The password to decrypt the file with
     * throws fatal error if wrong password
     */
    decryptFile: function (fileIn, password) {
        execSync('gpg --yes --batch --passphrase=' + password + ' ' + fileIn);
    },
    /*
     * Check if a file exists. These may be encrypted. Prompts for password if encrypted file only exists
     * {filepath}:  The filepath to the file to check. Encrypted files have same path put extension .gpg
     * return true if file exists and throws error if file unable to be decrypted
     */
    fileExists: function (filepath) {
        var exists = fs.existsSync(filepath);
        if (exists)
            return true;
        else {
            // Check if there is an encrypted file
            var encryptedFilepath = filepath + '.gpg'
            var encryptedExists = fs.existsSync(encryptedFilepath);
            if (encryptedExists) {
                // Decrypt file
                var password = prompt('Enter password for encrypted file ' + encryptedFilepath + ': ');
                this.decryptFile(encryptedFilepath, password);
                return this.fileExists(filepath);
            }
        }
    },
    /*
     * Check if a key file exists. These may be encrypted. Prompts for password if encrypted file only exists
     * {filepath}:  The filepath to the file to check. Encrypted files have same path put extension .gpg
     * return true if file exists and throws error if file unable to be decrypted
     */
    keyFileExists: function (filepath) {
        var exists = fs.existsSync(filepath);
        if (exists)
            return true;
        else {
            // Check if there is an encrypted file
            var encryptedFilepath = filepath + '.gpg'
            var encryptedExists = fs.existsSync(encryptedFilepath);
            if (encryptedExists) {
                // Decrypt file
                var password = prompt('Enter password for encrypted file ' + encryptedFilepath + ': ');
                this.decryptFile(encryptedFilepath, password);
                return this.keyFileExists(filepath);
            }
        }
    },
    /*
     * Creates a public/private key and encrypts them. public keys are created from filepath and .pub is added as file extension
     * {filepath}:  The full filepath to create the key
     * {password}:  The password to encrypt the key files with
     */
    createKeyFile: function (filepath, password) {
        var pair = keypair();
        var publicKey = forge.pki.publicKeyFromPem(pair.public);
        var ssh = forge.ssh.publicKeyToOpenSSH(publicKey);

        // Write & encrypt private key
        fs.writeFileSync(path.join(filepath), pair.private);
        this.encryptFile(filepath, password);
        // Write & encrypt public key
        fs.writeFileSync(path.join(filepath + '.pub'), ssh);
        this.encryptFile(filepath + '.pub', password);
    },

    /*
     * Retrieves the package version from the package.json file
     */
    getPackageJsonVersion: function () {
        return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
    },

    /*
     * Prompt sync with default values
     */
    promptDefault(message, defaultValue = null) {
        if (defaultValue === null) {
            return prompt(chalk.whiteBright(message + ': '));
        } else {

            return prompt(chalk.whiteBright(message + ' [') + chalk.cyan(defaultValue) + chalk.whiteBright(']' + ': '), defaultValue);
    }
    }
};
