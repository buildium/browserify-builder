# browserify-builder

This is a configuration tool for building multiple Browserify bundles in parallel with caching using browserify-incremental

##Config

The config object should be serializable.

###Options

- cache
  - Relative path to folder where browserify-incremental cache will be stored
  - Default: `false`
- parallel
  - Number of processes to run in parallel when building bundles. Setting to false will run serially
  - Default: `false`
- watch
  - Use watchify to watch for changes in bundles
  - Default: `false`
- watchOptions
  - Watchify options
  - Default: `null`
- options
  - Browserify options passed to each bundle. Can be overriden by options set on specific bundles
  - Default: `null`
- outputFilePattern
  - Relative path and file name for output bundles. The string `[name]` will be replaced with the bundle name
  - Default: `'[name].js'`
- apps
  - Map of regular bundles to create
    - Options
      - entry
        - The path to the entry file for the bundle
        - Default: none, this is required
      - options
        - Browserify options for this bundle
      - exclude
        - Modules to exclude from bundle. 
        - Default: all modules included by bundles specified in shared bundles
    - The property name is the name of the bundle
  - Default: `{}`
- shared
  - Map of shared bundles to create. These bundles can be collections of included modules.
  - Options
    - entry
      - The path to the entry file for the bundle
      - Default: null (not required for shared bundles)
    - options
      - Browserify options for this bundle
      - Default: `{}`
    - include
      - An array of modules to include in the bundle (uses Browserify's `require` option)
      - Default: `[]`
    - exclude
      - An array of modules to exclude from the bundle (uses Browserify's `external` option)
      - Default: `[]`
  - The property name is the name of the bundle
  - By default, any modules included in shared bundles will be excluded from app bundles
- transforms
  - An array of Browserify transforms. This should really only be used for global transforms. Otherwise, use package.json
  - Options
    - name
      - Name of the transform to be used
    - type
      - If the transform needs to be called as a function, set this to be 'function' (e.g. for using envify/custom)
      - Default: null
    - params
      - Array of params to pass if type is set to `function`
      - Default: `[]`
    - options
      - Options passed to Browserify for the transform (e.g. you can pass an object with global set to true)
      - Default: '{}'
 - plugins
   - An array of Browserify plugins
     - Options
       - name
         - Name of the plugin
       - options
         - Options for the plugin
     - This should be serializable.
     
##Usage

```
let config = require('./builder.config.js');
let createBuilder = require('browserify-builder');
let builder = createBuilder(config);
builder.buildAll();
```