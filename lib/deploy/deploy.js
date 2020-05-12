var utils = require('shipit-utils');

module.exports = function (shipit, config) {
    var module = {};
    
    require('./init')(shipit, config);
    require('./checks')(shipit, config);
    require('./fetch')(shipit, config);
    require('./sync')(shipit, config);
    
    utils.registerTask(shipit, 'deploy:task', [
        'deploy:checks',
        'deploy:fetch',
        'deploy:sync',
    ]);
    
    utils.registerTask(shipit, 'deploy:init:task', [
        'deploy:init:task:run',
        'deploy:checks'
    ]);

    return module;
};