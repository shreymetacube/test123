var fs = require('fs');
const path = require('path');
var util = require('../utils');

//var apiRoot = 'https://api.github.com/';

module.exports = function(config) {
    var module = {};
    var apiRoot = 'https://api.github.com/';
    /*
     * List deploy keys for a Github repository
     *  https://developer.github.com/v3/repos/keys/
     */
    module.listDeployKeys = function() {
        var options = {
            url: apiRoot + 'repos/' + config.git.owner + '/' + config.git.repository + '/keys',
            headers: getHeaders(),
        };

        return util.httpsGet(options);
    };
    /*
     * Add deploy key to GitHub repository
     * https://developer.github.com/v3/repos/keys/
     */
    module.addDeployKey = function(title, key, read_only) {
        var options = {
            url: apiRoot + 'repos/' + config.git.owner + '/' + config.git.repository + '/keys',
            headers: getHeaders(),
            body: {
                title: title,
                key: key,
                read_only: read_only,
            }
        };
        return util.httpsPost(options);
    };

    /*
     *  GET /repos/:owner/:repo/git/refs/tags
     *  https://developer.github.com/v3/git/refs/
     */
    module.getTags = function() {
        var options = {
            url: apiRoot + 'repos/' + config.git.owner + '/' + config.git.repository + '/git/refs/tags',
            headers: getTokenHeaders(),
        };
        return util.httpsGet(options);
    }

    /*
     * Default headers for accessing GitHub API using token authentication
     */
    function getTokenHeaders(){
        // Try to set config.git.token if not defined
        if(typeof config.git.token === 'undefined'){
            config.git.token = util.getGithubToken();
        }
        
        return {
            'user-agent': 'nodejs-https',
            'Authorization': 'Token ' + config.git.token
        };
    }

    /*
     * Default headers for accessing GitHub API
     */
    function getHeaders() {
        // Try to set config.git.token if not defined
        if(typeof config.git.token === 'undefined'){
            config.git.token = util.getGithubToken();
        }
        // Try to set config.git.username if not defined
        if(typeof config.git.username === 'undefined'){
            config.git.username = util.getGithubUsername();
        }
        
        return {
            'user-agent': 'nodejs-https',
            'Authorization': 'Basic ' + new Buffer(config.git.username + ':' + config.git.token).toString('base64')
        };
    };

    return module;
};