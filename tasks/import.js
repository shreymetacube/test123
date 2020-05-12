var shipitCaptain = require('shipit-captain');

module.exports = function (config) {
    var gulp = config.gulp;
    var sequence = require('gulp-sequence').use(gulp);
    var utils = require('../lib/utils');

    // Exports an environment (files/DBs) to the local drive
    gulp.task('import:site', function () {
        var options = {
            init: function (shipit) {
                require('../lib/import')(shipit, config);
            },
            run: ['import:task'],
            targetEnv: config.env.environment,
            confirm:false
        };
        
        var c = config.shipit;
        shipitCaptain(c, options);
    });

};

