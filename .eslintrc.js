const path = require('path');
const { _moduleAliases: alias } = require('./package.json');

module.exports = {
  extends: 'airbnb/base',
  rules: {
    'no-underscore-dangle': 'off',
    'import/no-extraneous-dependencies': 'off'
  },
  settings: {
    'import/resolver': {
      alias: Object.keys(alias).map(key => ([key, path.resolve(path.dirname(__filename), alias[key])])),
    }
  },
}