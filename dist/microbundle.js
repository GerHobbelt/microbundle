function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var path = require('path');
var chalk = _interopDefault(require('chalk'));
var asyncro = require('asyncro');
var glob = _interopDefault(require('tiny-glob/sync'));
var autoprefixer = _interopDefault(require('autoprefixer'));
var cssnano = _interopDefault(require('cssnano'));
var rollup = require('rollup');
var commonjs = _interopDefault(require('rollup-plugin-commonjs'));
var babel = _interopDefault(require('rollup-plugin-babel'));
var nodeResolve = _interopDefault(require('rollup-plugin-node-resolve'));
var buble = _interopDefault(require('rollup-plugin-buble'));
var rollupPluginTerser = require('rollup-plugin-terser');
var alias = _interopDefault(require('rollup-plugin-alias'));
var postcss = _interopDefault(require('rollup-plugin-postcss'));
var gzipSize = _interopDefault(require('gzip-size'));
var brotliSize = _interopDefault(require('brotli-size'));
var prettyBytes = _interopDefault(require('pretty-bytes'));
var shebangPlugin = _interopDefault(require('rollup-plugin-preserve-shebang'));
var typescript = _interopDefault(require('rollup-plugin-typescript2'));
var json = _interopDefault(require('rollup-plugin-json'));
var flow = _interopDefault(require('rollup-plugin-flow'));
var es6Promisify = require('es6-promisify');
var camelCase = _interopDefault(require('camelcase'));

// A type of promise-like that resolves synchronously and supports only one observer

function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
} // Asynchronously await a promise and pass the result to a finally continuation

function fixedFlow(options) {
  var plugin = flow(options);
  return Object.assign({}, plugin, {
    transform: function transform(code, id) {
      var ret = plugin.transform(code, id);
      if (ret && ret.code === code) { return null; }
      return ret;
    }

  });
}

var readFile = es6Promisify.promisify(fs.readFile); // export const writeFile = promisify(fs.writeFile);

var stat = es6Promisify.promisify(fs.stat);
var isDir = function (name) { return stat(name).then(function (stats) { return stats.isDirectory(); }).catch(function () { return false; }); };
var isFile = function (name) { return stat(name).then(function (stats) { return stats.isFile(); }).catch(function () { return false; }); };
var stdout = console.log.bind(console); // eslint-disable-line no-console

var stderr = console.error.bind(console);

function logError (err) {
  var error = err.error || err;
  var description = "" + (error.name ? error.name + ': ' : '') + (error.message || error);
  var message = error.plugin ? ("(" + (error.plugin) + " plugin) " + description) : description;
  stderr(chalk.bold.red(message));

  if (error.loc) {
    stderr();
    stderr(("at " + (error.loc.file) + ":" + (error.loc.line) + ":" + (error.loc.column)));
  }

  if (error.frame) {
    stderr();
    stderr(chalk.dim(error.frame));
  } else if (err.stack) {
    var headlessStack = error.stack.replace(message, '');
    stderr(chalk.dim(headlessStack));
  }

  stderr();
}

var getEntries = function (ref) {
  var input = ref.input;
  var cwd = ref.cwd;

  try {
    return Promise.resolve(asyncro.map([].concat(input), function (file) {
      try {
        file = path.resolve(cwd, file);
        return Promise.resolve(isDir(file)).then(function (_isDir3) {
          if (_isDir3) {
            file = path.resolve(file, 'index.js');
          }

          return file;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    })).then(function (_map) {
      var entries = _map.filter(function (item, i, arr) { return arr.indexOf(item) === i; });

      return entries;
    });
  } catch (e) {
    return Promise.reject(e);
  }
};

var getOutput = function (ref) {
  var cwd = ref.cwd;
  var output = ref.output;
  var pkgMain = ref.pkgMain;
  var pkgName = ref.pkgName;

  try {
    function _temp8(_isDir2) {
      if (_isDir2) {
        main = path.resolve(main, ((removeScope(pkgName)) + ".js"));
      }

      return main;
    }

    var main = path.resolve(cwd, output || pkgMain || 'dist');

    var _temp7 = !main.match(/\.[a-z]+$/);

    return Promise.resolve(_temp7 ? _temp8(_temp7) : Promise.resolve(isDir(main)).then(_temp8));
  } catch (e) {
    return Promise.reject(e);
  }
};

var getInput = function (ref) {
  var entries = ref.entries;
  var cwd = ref.cwd;
  var source = ref.source;
  var module = ref.module;

  try {
    function _temp6(_isDir) {
      function _temp5(_jsOrTs) {
        function _temp4(_jsOrTs2) {
          _concat.call([], _temp3 ? _jsOrTs2 : _jsOrTs2 || module).map(function (file) { return glob(file); }).forEach(function (file) { return input.push.apply(input, file); });

          return input;
        }

        return _temp3 || _temp2 || _jsOrTs ? _temp4(_temp3 ? _jsOrTs : _temp2 || _jsOrTs || jsOrTs(cwd, 'index')) : Promise.resolve(_temp3 ? _jsOrTs : _temp2 || _jsOrTs || jsOrTs(cwd, 'index')).then(_temp4);
      }

      return _temp3 || _temp2 || !_isDir ? _temp5(_temp3 ? _isDir : _temp2 || _isDir && jsOrTs(cwd, 'src/index')) : Promise.resolve(_temp3 ? _isDir : _temp2 || _isDir && jsOrTs(cwd, 'src/index')).then(_temp5);
    }

    var input = [];

    var _concat = [].concat,
          _temp3 = entries && entries.length,
          _temp2 = _temp3 || source && (Array.isArray(source) ? source : [source]).map(function (file) { return path.resolve(cwd, file); });

    return Promise.resolve(_temp3 || _temp2 ? _temp6(_temp3 ? entries : _temp2 || isDir(path.resolve(cwd, 'src'))) : Promise.resolve(_temp3 ? entries : _temp2 || isDir(path.resolve(cwd, 'src'))).then(_temp6));
  } catch (e) {
    return Promise.reject(e);
  }
};

var jsOrTs = function (cwd, filename) {
  try {
    return Promise.resolve(isFile(path.resolve(cwd, filename + '.ts'))).then(function (_isFile) {
      function _temp(_isFile2) {
        var extension = _isFile ? _isFile2 : _isFile2 ? '.tsx' : '.js';
        return path.resolve(cwd, ("" + filename + extension));
      }

      return _isFile ? _temp('.ts') : Promise.resolve(isFile(path.resolve(cwd, filename + '.tsx'))).then(_temp);
    });
  } catch (e) {
    return Promise.reject(e);
  }
};

var getConfigFromPkgJson = function (cwd) {
  try {
    return Promise.resolve(_catch(function () {
      return Promise.resolve(readFile(path.resolve(cwd, 'package.json'), 'utf8')).then(function (pkgJSON) {
        var pkg = JSON.parse(pkgJSON);
        return {
          hasPackageJson: true,
          pkg: pkg
        };
      });
    }, function (err) {
      var pkgName = path.basename(cwd);
      stderr(chalk.yellow(((chalk.yellow.inverse('WARN')) + " no package.json found. Assuming a pkg.name of \"" + pkgName + "\".")));
      var msg = String(err.message || err);
      if (!msg.match(/ENOENT/)) { stderr(("  " + (chalk.red.dim(msg)))); }
      return {
        hasPackageJson: false,
        pkg: {
          name: pkgName
        }
      };
    }));
  } catch (e) {
    return Promise.reject(e);
  }
};

var microbundle = function (inputOptions) {
  try {
    var getSizeInfo = function (code, filename) {
      try {
        var raw = options.raw || code.length < 5000;
        return Promise.resolve(gzipSize(code)).then(function (_gzipSize) {
          var gzip = formatSize(_gzipSize, filename, 'gz', raw);
          return Promise.resolve(brotliSize(code)).then(function (_brotliSize) {
            var brotli = formatSize(_brotliSize, filename, 'br', raw);
            return gzip + '\n' + brotli;
          });
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };

    var options = Object.assign({}, inputOptions);
    options.cwd = path.resolve(process.cwd(), inputOptions.cwd);
    var cwd = options.cwd;
    return Promise.resolve(getConfigFromPkgJson(cwd)).then(function (ref) {
      var hasPackageJson = ref.hasPackageJson;
      var pkg = ref.pkg;

      options.pkg = pkg;
      var ref$1 = getName({
        name: options.name,
        pkgName: options.pkg.name,
        amdName: options.pkg.amdName,
        hasPackageJson: hasPackageJson,
        cwd: cwd
      });
      var finalName = ref$1.finalName;
      var pkgName = ref$1.pkgName;
      options.name = finalName;
      options.pkg.name = pkgName;

      if (options.sourcemap !== false) {
        options.sourcemap = true;
      }

      return Promise.resolve(getInput({
        entries: options.entries,
        cwd: cwd,
        source: options.pkg.source,
        module: options.pkg.module
      })).then(function (_getInput) {
        options.input = _getInput;
        return Promise.resolve(getOutput({
          cwd: cwd,
          output: options.output,
          pkgMain: options.pkg.main,
          pkgName: options.pkg.name
        })).then(function (_getOutput) {
          options.output = _getOutput;
          return Promise.resolve(getEntries({
            cwd: cwd,
            input: options.input
          })).then(function (_getEntries) {
            options.entries = _getEntries;
            options.multipleEntries = options.entries.length > 1;
            var formats = (options.format || options.formats).split(','); // always compile cjs first if it's there:

            formats.sort(function (a, b) { return a === 'cjs' ? -1 : a > b ? 1 : 0; });
            var steps = [];

            for (var i = 0; i < options.entries.length; i++) {
              for (var j = 0; j < formats.length; j++) {
                steps.push(createConfig(options, options.entries[i], formats[j], i === 0 && j === 0));
              }
            }

            if (options.watch) {
              var onBuild = options.onBuild;
              return new Promise(function (resolve, reject) {
                stdout(chalk.blue(("Watching source, compiling to " + (path.relative(cwd, path.dirname(options.output))) + ":")));
                steps.map(function (options) {
                  rollup.watch(Object.assign({
                    output: options.outputOptions,
                    watch: WATCH_OPTS
                  }, options.inputOptions)).on('event', function (e) {
                    if (e.code === 'FATAL') {
                      return reject(e.error);
                    } else if (e.code === 'ERROR') {
                      logError(e.error);
                    }

                    if (e.code === 'END') {
                      getSizeInfo(options._code, options.outputOptions.file).then(function (text) {
                        stdout(("Wrote " + (text.trim())));
                      });

                      if (typeof onBuild === 'function') {
                        onBuild(e);
                      }
                    }
                  });
                });
              });
            }

            var cache;
            return Promise.resolve(asyncro.series(steps.map(function (ref) {
              var inputOptions = ref.inputOptions;
              var outputOptions = ref.outputOptions;

              return function () {
              try {
                inputOptions.cache = cache;
                return Promise.resolve(rollup.rollup(inputOptions)).then(function (bundle) {
                  cache = bundle;
                  return Promise.resolve(bundle.write(outputOptions)).then(function (ref) {
                    var code = ref.code;

                    return Promise.resolve(getSizeInfo(code, outputOptions.file));
                  });
                });
              } catch (e) {
                return Promise.reject(e);
              }
            };
            }))).then(function (out) {
              return chalk.blue(("Build \"" + (options.name) + "\" to " + (path.relative(cwd, path.dirname(options.output)) || '.') + ":")) + '\n   ' + out.join('\n   ');
            });
          });
        });
      });
    });
  } catch (e) {
    return Promise.reject(e);
  }
};

var removeScope = function (name) { return name.replace(/^@.*\//, ''); }; // Convert booleans and int define= values to literals.
// This is more intuitive than `microbundle --define A=1` producing A="1".


var toReplacementExpression = function (value, name) {
  // --define A="1",B='true' produces string:
  var matches = value.match(/^(['"])(.+)\1$/);

  if (matches) {
    return [JSON.stringify(matches[2]), name];
  } // --define A=1,B=true produces int/boolean literal:


  if (/^(true|false|\d+)$/i.test(value)) {
    return [value, name];
  } // default: string literal


  return [JSON.stringify(value), name];
}; // Normalize Terser options from microbundle's relaxed JSON format (mutates argument in-place)


function normalizeMinifyOptions(minifyOptions) {
  var mangle = minifyOptions.mangle || (minifyOptions.mangle = {});
  var properties = mangle.properties; // allow top-level "properties" key to override mangle.properties (including {properties:false}):

  if (minifyOptions.properties != null) {
    properties = mangle.properties = minifyOptions.properties && Object.assign(properties, minifyOptions.properties);
  } // allow previous format ({ mangle:{regex:'^_',reserved:[]} }):


  if (minifyOptions.regex || minifyOptions.reserved) {
    if (!properties) { properties = mangle.properties = {}; }
    properties.regex = properties.regex || minifyOptions.regex;
    properties.reserved = properties.reserved || minifyOptions.reserved;
  }

  if (properties) {
    if (properties.regex) { properties.regex = new RegExp(properties.regex); }
    properties.reserved = [].concat(properties.reserved || []);
  }
} // Parses values of the form "$=jQuery,React=react" into key-value object pairs.


var parseMappingArgument = function (globalStrings, processValue) {
  var globals = {};
  globalStrings.split(',').forEach(function (globalString) {
    var assign;

    var ref = globalString.split('=');
    var key = ref[0];
    var value = ref[1];

    if (processValue) {
      var r = processValue(value, key);

      if (r !== undefined) {
        if (Array.isArray(r)) {
          (assign = r, value = assign[0], key = assign[1]);
        } else {
          value = r;
        }
      }
    }

    globals[key] = value;
  });
  return globals;
}; // Extensions to use when resolving modules


var EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.es6', '.es', '.mjs'];
var WATCH_OPTS = {
  exclude: 'node_modules/**'
}; // Hoist function because something (rollup?) incorrectly removes it

function formatSize(size, filename, type, raw) {
  var pretty = raw ? (size + " B") : prettyBytes(size);
  var color = size < 5000 ? 'green' : size > 40000 ? 'red' : 'yellow';
  var MAGIC_INDENTATION = type === 'br' ? 13 : 10;
  return ("" + (' '.repeat(MAGIC_INDENTATION - pretty.length)) + (chalk[color](pretty)) + ": " + (chalk.white(path.basename(filename))) + "." + type);
}

var safeVariableName = function (name) { return camelCase(removeScope(name).toLowerCase().replace(/((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g, '')); };

function getName(ref) {
  var name = ref.name;
  var pkgName = ref.pkgName;
  var amdName = ref.amdName;
  var cwd = ref.cwd;
  var hasPackageJson = ref.hasPackageJson;

  if (!pkgName) {
    pkgName = path.basename(cwd);

    if (hasPackageJson) {
      stderr(chalk.yellow(((chalk.yellow.inverse('WARN')) + " missing package.json \"name\" field. Assuming \"" + pkgName + "\".")));
    }
  }

  return {
    finalName: name || amdName || safeVariableName(pkgName),
    pkgName: pkgName
  };
}

function createConfig(options, entry, format, writeMeta) {
  var pkg = options.pkg;
  var external = ['dns', 'fs', 'path', 'url'].concat(options.entries.filter(function (e) { return e !== entry; }));
  var outputAliases = {}; // since we transform src/index.js, we need to rename imports for it:

  if (options.multipleEntries) {
    outputAliases['.'] = './' + path.basename(options.output);
  }

  var moduleAliases = options.alias ? parseMappingArgument(options.alias) : {};
  var peerDeps = Object.keys(pkg.peerDependencies || {});

  if (options.external === 'none') ; else if (options.external) {
    external = external.concat(peerDeps).concat(options.external.split(','));
  } else {
    external = external.concat(peerDeps).concat(Object.keys(pkg.dependencies || {}));
  }

  var globals = external.reduce(function (globals, name) {
    // valid JS identifiers are usually library globals:
    if (name.match(/^[a-z_$][a-z0-9_$]*$/)) {
      globals[name] = name;
    }

    return globals;
  }, {});

  if (options.globals && options.globals !== 'none') {
    globals = Object.assign(globals, parseMappingArgument(options.globals));
  }

  var defines = {};

  if (options.define) {
    defines = Object.assign(defines, parseMappingArgument(options.define, toReplacementExpression));
  }

  function replaceName(filename, name) {
    return path.resolve(path.dirname(filename), name + path.basename(filename).replace(/^[^.]+/, ''));
  }

  var mainNoExtension = options.output;

  if (options.multipleEntries) {
    var name = entry.match(/([\\/])index(\.(umd|cjs|es|m))?\.m?js$/) ? mainNoExtension : entry;
    mainNoExtension = path.resolve(path.dirname(mainNoExtension), path.basename(name));
  }

  mainNoExtension = mainNoExtension.replace(/(\.(umd|cjs|es|m))?\.m?js$/, '');
  var moduleMain = replaceName(pkg.module && !pkg.module.match(/src\//) ? pkg.module : pkg['jsnext:main'] || 'x.mjs', mainNoExtension);
  var cjsMain = replaceName(pkg['cjs:main'] || 'x.js', mainNoExtension);
  var umdMain = replaceName(pkg['umd:main'] || 'x.umd.js', mainNoExtension); // let rollupName = safeVariableName(basename(entry).replace(/\.js$/, ''));

  var nameCache = {};
  var bareNameCache = nameCache; // Support "minify" field and legacy "mangle" field via package.json:

  var minifyOptions = options.pkg.minify || options.pkg.mangle || {};
  var useTypescript = path.extname(entry) === '.ts' || path.extname(entry) === '.tsx';
  var externalPredicate = new RegExp(("^(" + (external.join('|')) + ")($|/)"));
  var externalTest = external.length === 0 ? function () { return false; } : function (id) { return externalPredicate.test(id); };

  function loadNameCache() {
    try {
      nameCache = JSON.parse(fs.readFileSync(path.resolve(options.cwd, 'mangle.json'), 'utf8')); // mangle.json can contain a "minify" field, same format as the pkg.mangle:

      if (nameCache.minify) {
        minifyOptions = Object.assign({}, minifyOptions || {}, nameCache.minify);
      }
    } catch (e) {}
  }

  loadNameCache();
  normalizeMinifyOptions(minifyOptions);
  if (nameCache === bareNameCache) { nameCache = null; }
  var shebang;
  var config = {
    inputOptions: {
      input: entry,
      external: function (id) {
        if (id === 'babel-plugin-transform-async-to-promises/helpers') {
          return false;
        }

        if (options.multipleEntries && id === '.') {
          return true;
        }

        return externalTest(id);
      },
      treeshake: {
        propertyReadSideEffects: false
      },
      plugins: [].concat(postcss({
        plugins: [autoprefixer(), options.compress !== false && cssnano({
          preset: 'default'
        })].filter(Boolean),
        // only write out CSS for the first bundle (avoids pointless extra files):
        inject: !!options.injectStyles,
        extract: !options.injectStyles && !!writeMeta
      }), Object.keys(moduleAliases).length > 0 && alias(Object.assign({}, moduleAliases, {
        resolve: EXTENSIONS
      })), nodeResolve({
        module: true,
        jsnext: true,
        browser: options.target !== 'node'
      }), commonjs({
        // use a regex to make sure to include eventual hoisted packages
        include: /\/node_modules\//
      }), json(), useTypescript && typescript({
        typescript: require('typescript'),
        cacheRoot: ("./.rts2_cache_" + format),
        tsconfigDefaults: {
          compilerOptions: {
            sourceMap: options.sourcemap,
            declaration: true,
            jsx: options.jsx
          }
        },
        tsconfigOverride: {
          compilerOptions: {
            target: 'esnext'
          }
        }
      }), !useTypescript && fixedFlow({
        all: true,
        pretty: true
      }), babel({
        babelrc: false,
        configFile: false,
        compact: false,
        include: 'node_modules/**',
        plugins: [[require.resolve('babel-plugin-transform-replace-expressions'), {
          replace: defines
        }]]
      }), // Only used for async await
      babel({
        // We mainly use bublé to transpile JS and only use babel to
        // transpile down `async/await`. To prevent conflicts with user
        // supplied configurations we set this option to false. Note
        // that we never supported using custom babel configs anyway.
        babelrc: false,
        extensions: EXTENSIONS,
        exclude: 'node_modules/**',
        plugins: [require.resolve('@babel/plugin-syntax-jsx'), [require.resolve('babel-plugin-transform-replace-expressions'), {
          replace: defines
        }], [require.resolve('babel-plugin-transform-async-to-promises'), {
          inlineHelpers: true,
          externalHelpers: true
        }], [require.resolve('@babel/plugin-proposal-class-properties'), {
          loose: true
        }]]
      }), {
        // Custom plugin that removes shebang from code because newer
        // versions of bublé bundle their own private version of `acorn`
        // and I don't know a way to patch in the option `allowHashBang`
        // to acorn.
        // See: https://github.com/Rich-Harris/buble/pull/165
        transform: function transform(code) {
          var reg = /^#!(.*)/;
          var match = code.match(reg);

          if (match !== null) {
            shebang = '#!' + match[0];
          }

          code = code.replace(reg, '');
          return {
            code: code,
            map: null
          };
        }

      }, buble({
        exclude: 'node_modules/**',
        jsx: options.jsx || 'h',
        objectAssign: options.assign || 'Object.assign',
        transforms: {
          dangerousForOf: true,
          dangerousTaggedTemplateString: true
        }
      }), // We should upstream this to rollup
      // format==='cjs' && replace({
      // 	[`module.exports = ${rollupName};`]: '',
      // 	[`var ${rollupName} =`]: 'module.exports ='
      // }),
      // This works for the general case, but could cause nasty scope bugs.
      // format==='umd' && replace({
      // 	[`return ${rollupName};`]: '',
      // 	[`var ${rollupName} =`]: 'return'
      // }),
      // format==='es' && replace({
      // 	[`export default ${rollupName};`]: '',
      // 	[`var ${rollupName} =`]: 'export default'
      // }),
      options.compress !== false && [rollupPluginTerser.terser({
        sourcemap: true,
        output: {
          comments: false
        },
        compress: Object.assign({
          keep_infinity: true,
          pure_getters: true,
          passes: 10
        }, minifyOptions.compress || {}),
        warnings: true,
        ecma: 5,
        toplevel: format === 'cjs' || format === 'es',
        mangle: Object.assign({}, minifyOptions.mangle || {}),
        nameCache: nameCache
      }), nameCache && {
        // before hook
        options: loadNameCache,

        // after hook
        onwrite: function onwrite() {
          if (writeMeta && nameCache) {
            fs.writeFile(path.resolve(options.cwd, 'mangle.json'), JSON.stringify(nameCache, null, 2), Object);
          }
        }

      }], {
        ongenerate: function ongenerate(outputOptions, ref) {
          var code = ref.code;

          config._code = code;
        }

      }, shebangPlugin({
        shebang: shebang
      })).filter(Boolean)
    },
    outputOptions: {
      paths: outputAliases,
      globals: globals,
      strict: options.strict === true,
      legacy: true,
      freeze: false,
      esModule: false,
      sourcemap: options.sourcemap,
      format: format,
      name: options.name,
      file: path.resolve(options.cwd, format === 'es' && moduleMain || format === 'umd' && umdMain || cjsMain)
    }
  };
  return config;
}

module.exports = microbundle;
//# sourceMappingURL=microbundle.js.map
