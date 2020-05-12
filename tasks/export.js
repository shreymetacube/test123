var shipitCaptain = require('shipit-captain');

module.exports = function (config) {
    var gulp = config.gulp;
    var sequence = require('gulp-sequence').use(gulp);
    var utils = require('../lib/utils');

    // Exports an environment (files/DBs) to the local drive
    gulp.task('export:site', function () {
        var options = {
            init: function (shipit) {
                require('../lib/export')(shipit, config);
            },
            run: ['export:task'],
            targetEnv: config.env.environment,
            confirm: false
        };
        // Only run export if globally allowed
        if (config.env.allowExport) {
            var c = config.shipit;
            shipitCaptain(c, options);
        }
    });

};

