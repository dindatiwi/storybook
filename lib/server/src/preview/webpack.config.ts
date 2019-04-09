import path from 'path';
import webpack from 'webpack';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';

import { getStorybookCachePath } from '@storybook/config';

import { EnviromentType, BuildConfig, OutputConfig } from '../types';

const cacheDir = getStorybookCachePath();

const createEntrypoints = async (env: EnviromentType): Promise<string[]> => {
  const coreDistFolder = path.join(
    path.dirname(require.resolve('@storybook/core/package.json')),
    'dist'
  );
  return [
    `${coreDistFolder}/server/common/polyfills.js`,
    `${coreDistFolder}/client/manager/index.js`,
  ];
};

const createBaseWebpackConfig = async (
  env: EnviromentType,
  output: OutputConfig
): Promise<webpack.Configuration> => {
  return {
    name: 'preview',
    mode: env,
    bail: env === 'production',
    devtool: false,

    entry: await createEntrypoints(env),
    output: {
      path: output.location,
      filename: '[name].[chunkhash].bundle.js',
      publicPath: '',
    },

    plugins: [
      new HtmlWebpackPlugin({
        filename: `index.html`,
        chunksSortMode: 'none',
        alwaysWriteToDisk: true,
        inject: false,
        templateParameters: (compilation, files, templateOptions) => ({
          compilation,
          files,
          options: templateOptions,
          version: 1,
          dlls: [],
          headHtmlSnippet: '',
        }),
        template: require.resolve(`../templates/index.ejs`),
      }),
      new CaseSensitivePathsPlugin(),
    ],

    resolve: {
      extensions: ['.mjs', '.js', '.jsx', '.json'],
      modules: ['node_modules'],
    },
    recordsPath: path.join(cacheDir, 'records.json'),
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
      runtimeChunk: true,
    },
  };
};

export { createBaseWebpackConfig };