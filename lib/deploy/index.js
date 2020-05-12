
var shipitCaptain = require('shipit-captain');
var argv = require('yargs').argv;


module.exports = function (config) {
    var gulp = config.gulp;

    // Deploy a site to an environment
    gulp.task('deploy:site', function () {
        var options = {
            init: function (shipit) {
                require('./deploy')(shipit, config);
            },
            run: ['deploy:task'],
            targetEnv: config.env.environment,
            confirm: false
        };

        var c = config.shipit;
        shipitCaptain(c, options);
    });

    // Sets up servers in an environment
    gulp.task('deploy:init', function () {
        var options = {
            init: function (shipit) {
                require('./deploy')(shipit, config);
            },
            run: ['deploy:init:task'],
            targetEnv: config.env.environment,
            confirm: false
        };

        var c = config.shipit;
        shipitCaptain(c, options);
    });

};