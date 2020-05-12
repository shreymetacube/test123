var git = require('gulp-git');
var fs = require('fs');
var prompt = require('prompt-sync')();

module.exports = function (config) {
    var gulp = config.gulp;
    var sequence = require('gulp-sequence').use(gulp);
    var utils = require('../lib/utils');

    gulp.task('encrypt:file', function () {
        var password = prompt('Enter password to encrypted file ' + config.encryptFile + ': ');
        utils.encryptFile(config.encryptFile,password);
    });
    
    gulp.task('encrypt:decrypt', function () {
        var password = prompt('Enter password for encrypted file ' + config.encryptFile + ': ');
        utils.decryptFile(config.encryptFile,password);
    });

};

