
module.exports = (game, opts) ->
  return new Chest(game, opts)

module.exports.pluginInfo =
  loadAfter: ['voxel-blockdata']

class Chest
  constructor: (@game, opts) ->

