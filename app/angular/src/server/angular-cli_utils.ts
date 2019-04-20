import fs from 'fs';
import { basename, dirname, normalize, relative, resolve } from '@angular-devkit/core';

// todo check if there's already a correct type for this
interface Rule {
  test: RegExp;
}

interface Config {
  module: {
    rules: Rule[];
  };
}

function isDirectory(assetPath: string) {
  try {
    return fs.statSync(assetPath).isDirectory();
  } catch (e) {
    return false;
  }
}

function getAssetsParts(resolvedAssetPath: Path, assetPath: Path) {
  if (isDirectory(resolvedAssetPath)) {
    return {
      glob: '**/*', // Folders get a recursive star glob.
      input: assetPath, // Input directory is their original path.
    };
  }

  return {
    glob: basename(assetPath), // Files are their own glob.
    input: dirname(assetPath), // Input directory is their original dirname.
  };
}

function isStylingRule(rule: Rule) {
  const { test } = rule;

  if (!test) {
    return false;
  }

  if (!(test instanceof RegExp)) {
    return false;
  }

  return test.test('.css') || test.test('.scss') || test.test('.sass');
}

export function filterOutStylingRules(config: Config) {
  return config.module.rules.filter(rule => !isStylingRule(rule));
}

export function isBuildAngularInstalled() {
  try {
    require.resolve('@angular-devkit/build-angular');
    return true;
  } catch (e) {
    return false;
  }
}

// todo add type
export function getAngularCliParts(cliWebpackConfigOptions: any) {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  // tslint:disable-next-line: no-implicit-dependencies
  const ngCliConfigFactory = require('@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs');

  try {
    return {
      cliCommonConfig: ngCliConfigFactory.getCommonConfig(cliWebpackConfigOptions),
      cliStyleConfig: ngCliConfigFactory.getStylesConfig(cliWebpackConfigOptions),
    };
  } catch (e) {
    return null;
  }
}

// todo fix any
export function normalizeAssetPatterns(assetPatterns: any, dirToSearch: Path, sourceRoot: Path) {
  if (!assetPatterns || !assetPatterns.length) {
    return [];
  }

  // todo fix any
  return assetPatterns.map((assetPattern: any) => {
    if (typeof assetPattern === 'object') {
      return assetPattern;
    }

    const assetPath = normalize(assetPattern);
    const resolvedSourceRoot = resolve(dirToSearch, sourceRoot);
    const resolvedAssetPath = resolve(dirToSearch, assetPath);
    const parts = getAssetsParts(resolvedAssetPath, assetPath);

    // Output directory for both is the relative path from source root to input.
    const output = relative(resolvedSourceRoot, resolve(dirToSearch, parts.input));

    // Return the asset pattern in object format.
    return {
      ...parts,
      output,
    };
  });
}