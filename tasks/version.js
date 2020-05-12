var bump = require('gulp-bump');
var gutil = require('gulp-util');
var prompt = require('gulp-prompt');
var fs = require('fs');

module.exports = function (config) {
    var gulp = config.gulp;
    var sequence = require('gulp-sequence').use(gulp);
    
    // Type of patch (major, minor, patch) asked from the user. Defaults to 'patch'
    var patchType = "patch";

    gulp.task('version:type', function () {
        return gulp.src('')
                .pipe(prompt.prompt({
                    name: 'type',
                    type: 'list',
                    message: 'Select version change type.',
                    choices: ['patch', 'minor', 'major']
                }, function (ans) {
                    patchType = ans.type;
                }));
    });

    gulp.task('version:bump', function () {
        console.log("Patch Type: "+patchType);
        return gulp.src(['./bower.json', './package.json'])
                .pipe(bump({type: patchType}).on('error', gutil.log))
                .pipe(gulp.dest('./'));
    });

    gulp.task('version', sequence('version:type', 'version:bump'));
};
