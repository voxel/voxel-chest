
Modal = require 'voxel-modal'
Inventory = require 'inventory'
InventoryWindow = require 'inventory-window'
ItemPile = require 'itempile'
{Recipe, AmorphousRecipe, PositionalRecipe, CraftingThesaurus, RecipeList} = require 'craftingrecipes'

module.exports = (game, opts) ->
  return new Chest(game, opts)

module.exports.pluginInfo =
  loadAfter: ['voxel-blockdata', 'voxel-registry', 'craftingrecipes']

class Chest
  constructor: (@game, opts) ->
    # TODO: really ought to refactor this with voxel-chest and voxel-inventory-dialog! seriously
    @playerInventory = opts.playerInventory ? throw 'voxel-chest requires "playerInventory" set to inventory instance'
    @registry = game.plugins?.get('voxel-registry')
    @recipes = game.plugins?.get('craftingrecipes')
    @blockdata = game.plugins?.get('voxel-blockdata')

    opts.registerBlock ?= @registry?
    opts.registerRecipe ?= @recipes?
    
    @chestDialog = new ChestDialog(game, @playerInventory, @registry, @blockdata)

    @opts = opts
    @enable()

  enable: () ->
    if @opts.registerBlock
      # TODO: chest textures? not in current tp..
      @registry.registerBlock 'chest', {texture: ['door_wood_lower', 'piston_top_normal', 'bookshelf'], onInteract: () =>  
         @chestDialog.open()
         true
       }

    if @opts.registerRecipe
      @recipes.register new PositionalRecipe([
        ['wood.plank', 'wood.plank', 'wood.plank'], 
        ['wood.plank', undefined, 'wood.plank'], 
        ['wood.plank', 'wood.plank', 'wood.plank']],
        new ItemPile('chest', 1))

  disable: () ->
    # TODO


class ChestDialog extends Modal
  constructor: (@game, @playerInventory, @registry, @blockdata) ->
    # TODO: refactor with voxel-inventory-dialog
    @playerIW = new InventoryWindow {
      width: 10
      inventory: @playerInventory
      }

    # TODO: persist on close, restore on open (voxel-blockdata)
    @chestInventory = new Inventory(10, 3)  # TODO: bigger varieties
    @chestIW = new InventoryWindow {inventory:@chestInventory}

    # the overall dialog
    @dialog = document.createElement('div')
    @dialog.style.border = '6px outset gray'
    @dialog.style.visibility = 'hidden'
    @dialog.style.position = 'absolute'
    @dialog.style.top = '20%'
    @dialog.style.left = '30%'
    @dialog.style.zIndex = 1
    @dialog.style.backgroundImage = 'linear-gradient(rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.5) 100%)'
    document.body.appendChild(@dialog)

    chestCont = @chestIW.createContainer()

    @dialog.appendChild(chestCont)
    @dialog.appendChild(document.createElement('br')) # TODO: better positioning
    # player inventory at bottom
    @dialog.appendChild(@playerIW.createContainer())

    super game, {element: @dialog}

