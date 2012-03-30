module.exports = {
  string: {
    defaultName: 'string',
    type: 'string'
  },
  number: {
    defaultName: 'number',
    type: 'number'
  },
  boolean: {
    defaultName: 'boolean',
    type: 'boolean',
    default: 'false'
  },
  date: {
    defaultName: 'date',
    type: 'string',
    pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:.\d{1,3})?Z$/
  }
};