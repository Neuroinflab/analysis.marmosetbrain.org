const webpack = require('webpack');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, '../static/scripts');
const APP_DIR = path.resolve(__dirname, 'js');

//devtool2: '#cheap-module-eval-source-map',

const config = {
    entry: {
        app: APP_DIR + '/app.js',
        commons: ['lodash', 'react', 'react-dom', 'd3', 'prop-types', 'react-rangeslider', 'moment']
    },
    output: {
        path: BUILD_DIR,
        filename: 'bundle.min.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?/,
                include: APP_DIR,
                loader: 'babel-loader'
            }
        ]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'commons',
            filename: 'commons.min.js',
            // minChunks: 3,
            // chunks: ["pageA", "pageB"],
            // (Only use these entries)
        })
    ]
};
module.exports = config;
