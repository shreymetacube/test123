var git = require('gulp-git');
var fs = require('fs');

module.exports = function (config) {
    var gulp = config.gulp;
    var sequence = require('gulp-sequence').use(gulp);
    var utils = require('../lib/utils');
    var gitkey = require('../lib/git/gitkey')(config);

    gulp.task('git:commit', function () {
        return gulp.src('.')
                .pipe(git.add())
                .pipe(git.commit('chore(general): release version ' + utils.getPackageJsonVersion()));
    });

    gulp.task('git:tag', function (callback) {
        version = utils.getPackageJsonVersion();
        git.tag('v' + version, 'Version ' + version, function (err) {
            callback(err);
        });
    });

    gulp.task('git:push', function (callback) {
        git.push('origin', 'master', {args: '--tags'}, function (err) {
            console.log(err);
        });
    });


    // Git commit and push of a release version
    gulp.task('git:release', sequence('git:commit', 'git:tag', 'git:push'));

    // Setting up a GitHub deploy key for the project
    gulp.task('git:setkey', function(){
        gitkey.setupKey();
    });

};

