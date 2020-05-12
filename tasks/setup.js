var fs = require('fs');
var shipitCaptain = require('shipit-captain');


module.exports = function (config) {
    var gulp = config.gulp;
    var sequence = require('gulp-sequence').use(gulp);
    var utils = require('../lib/utils');

    // Sets up servers in an environment
    gulp.task('setup:env', function () {
        var options = {
            init: function (shipit) {
                require('../lib/shipit')(shipit, config);
            },
            run: ['setup:env:task'],
            targetEnv: config.env.environment,
            confirm:false
        };
        
        var c = config.shipit;
        shipitCaptain(c, options);
    });

};

