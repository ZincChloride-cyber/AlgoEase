const webpack = require('webpack');

module.exports = {
  resolve: {
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "assert": require.resolve("assert"),
      "util": require.resolve("util"),
      "http": false,
      "https": false,
      "os": require.resolve("os-browserify/browser"),
      "fs": false,
      "path": false,
      "crypto": false,
      "buffer": require.resolve("buffer"),
      "process": require.resolve("process/browser")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
