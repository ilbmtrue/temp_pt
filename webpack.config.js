var webpack = require('webpack');
const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool : 'source-map',
    entry: {
        index: './src/index.js',
        'join-page': './src/joinpage.js',
        reactApp: './src/App.js',
        reactAppJoin: './src/AppJoin.js',
    },
    output:{
        // path: path.join(__dirname, '/dist'),
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
   },
    optimization:{
        splitChunks:{
            chunks: 'all'
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
          }),
        // new HTMLWebpackPlugin({
        //     filename: 'game.html',
        //     template: './src/game.html',
        //     chunks: ["index"]
        // }),
        new HTMLWebpackPlugin({
            filename: 'join-page.html',
            template: './src/join-page.html',
            chunks: ["reactAppJoin"]
        }),
        // new HTMLWebpackPlugin({
        //     filename: 'join-page.html',
        //     template: './src/join-page.html',
        //     chunks: ["join-page"]
        // }),
        new HTMLWebpackPlugin({
            filename: 'battle.html',
            template: './src/battle.html',
            chunks: ["reactApp"]
        }),
        
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: './src/img', to: './img' },
                { from: './src/img/cards', to: './img/cards' },
                { from: './src/admin/', to: './admin' },
                { from: 'node_modules/jquery/dist/jquery.min.js', to: './admin' },
            ],
        }),
    ],
    module:{
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                resolve: {
                  extensions: [".js", ".jsx"]
                },
                use: {
                  loader: "babel-loader",
                  options:{
                    presets:["@babel/preset-env", "@babel/preset-react"]    // используемые плагины
                  }
                },
                
              },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                        name: 'img/[name].[ext]'                       
                    },
                  },
                ],
            },
            {
                test: /\.scss$/,
                use: [
                        'style-loader',
                        MiniCssExtractPlugin.loader,
                        {
                        loader: 'css-loader',
                        options: { sourceMap: true }
                        }, 
                        {
                        loader: 'sass-loader',
                        options: { sourceMap: true }
                        }
                    ],
            },
            
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
        ]
    },
    
};