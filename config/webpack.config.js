const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const yaml = require('js-yaml');

module.exports = function (config) {
    var module = {};

    module.getConfig = function (folder) {
        var moduleBaseDir = path.join(process.cwd(), config.directory.modules);
        var moduleDir = path.join(process.cwd(), config.directory.modules, folder);
        var moduleDistDir = path.join(moduleDir, config.directory.dist);
        var entry = path.join(moduleDir, 'main.js');
        var entries = {};
        var libFilepath = path.join(moduleDir, folder + '.' + config.directory.libFilename);

        // Configure webpack to split code based on module's libraries.yml file
        if (config.env.build.splitLibrary && fs.existsSync(libFilepath)) {
            
            var libConfig = yaml.safeLoad(fs.readFileSync(libFilepath, 'utf8'));

            Object.entries(libConfig).forEach(([key, value]) => {
                entries = Object.assign(
                    {[key]:path.join(moduleDir,key+'.js')},
                    entries
                );
            });
        }
        // Otherwise use the default entry to main.js
        else {
            entries = {
                main: entry
            };
        }

        // Only return a webpack config if the entry file exists
        if (fs.existsSync(entry)) {
            var conf = {
                directory: {
                    moduleDir: moduleDir,
                    moduleDistDir: moduleDistDir,
                    entry: entry
                },
                webpack: {
                    entry: entries,
                    module: {
                        rules: [{
                                test: /\.js$/,
                                exclude: /(node_modules|bower_components)/,
                                use: {
                                    loader: 'babel-loader',
                                    options: {
                                        presets: ['es2015']
                                    }
                                }
                            },
                            {
                                test: /\.scss$/,
                                include: [
                                    path.resolve(moduleDir),
                                    path.resolve(moduleDir, "src/scss")
                                ],
                                use: ExtractTextPlugin.extract({
                                    fallback: 'style-loader',
                                    //resolve-url-loader may be chained before sass-loader if necessary
                                    use: [{
                                        loader: 'css-loader',
                                        options: {
                                            minimize: config.env.minify ? true : false
                                        }
                                    }, {
                                        loader: 'sass-loader',
                                    }]
                                })
                            },
                            {
                                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                                loader: 'url-loader',
                                options: {
                                    limit: 10000
                                }
                            }
                        ],
                    },
                    resolve: {
                        modules: [moduleBaseDir, 'node_modules'],
                    },
                    output: {
                        path: path.resolve(moduleDistDir),
                        filename: config.env.minify ? '[name].min.js' : '[name].js'
                    },
                    plugins: [
                        new ExtractTextPlugin(config.env.minify ? "[name].min.css" : "[name].css"),
                    ]
                }
            };
            return conf;

        } else {
            return false;
        }
    };

    return module;
};