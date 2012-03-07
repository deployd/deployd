module.exports = require('../types/collection')
  .use('/resources')
;

// TODO
// - Run migration on PUT (when name is deleted remove property)
// - PUT requests come back {task: {$renameFrom: 'title'}}
// - or