/*
 * Wrapper for shipit tasks
 */
module.exports = function (shipit, config) {
    shipit.initConfig(config.shipit);
    
    require('./setup')(shipit, config);

}