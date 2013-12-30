# vim: set shiftwidth=2 tabstop=2 softtabstop=2 expandtab:

ModalDialog = require 'voxel-modal-dialog'
Inventory = require 'inventory'
InventoryWindow = require 'inventory-window'
ItemPile = require 'itempile'
{Recipe, AmorphousRecipe, PositionalRecipe, CraftingThesaurus, RecipeList} = require 'craftingrecipes'

module.exports = (game, opts) ->
  return new Chest(game, opts)

module.exports.pluginInfo =
  loadAfter: ['voxel-blockdata', 'voxel-registry', 'craftingrecipes', 'voxel-carry']

class Chest
  constructor: (@game, opts) ->
    @playerInventory = game.plugins?.get('voxel-carry')?.inventory ? opts.playerInventory ? throw 'voxel-chest requires "voxel-carry" plugin or "playerInventory" set to inventory instance'
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
      @registry.registerBlock 'chest', {texture: ['door_wood_lower', 'piston_top_normal', 'bookshelf'], onInteract: (target) =>  
         @chestDialog.open(target)
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


class ChestDialog extends ModalDialog
  constructor: (@game, @playerInventory, @registry, @blockdata) ->
    # TODO: refactor with voxel-inventory-dialog
    @playerIW = new InventoryWindow {width:10, registry:@registry, inventory: @playerInventory}

    @chestInventory = new Inventory(10, 3)
    @chestInventory.on 'changed', () => @updateBlockdata()
    @chestIW = new InventoryWindow {inventory:@chestInventory, registry:@registry}

    # allow shift-click to transfer items between these two inventories
    @chestIW.linkedInventory = @playerInventory
    @playerIW.linkedInventory = @chestInventory

    chestCont = @chestIW.createContainer()

    contents = []
    contents.push chestCont
    contents.push document.createElement('br') # TODO: better positioning
    # player inventory at bottom
    contents.push @playerIW.createContainer()

    console.log 'ChestDialog, super=',super
    super game, {contents: contents}

  loadBlockdata: (x, y, z) ->
    if not @blockdata?
      console.log 'voxel-blockdata not loaded, voxel-chest persistence disabled'
      return

    bd = @blockdata.get x, y, z
    console.log 'activeBlockdata=',JSON.stringify(bd)
    if bd?
      console.log 'load existing at ',x,y,z
      # TODO: better way to 'load' into an inventory than setting all slots?
      newInventory = Inventory.fromString(bd.inventory)
      console.log 'newInventory='+JSON.stringify(newInventory)
      for itemPile, i in newInventory.array  # TODO: if smaller than current?
        console.log 'load chest',i,itemPile
        @chestInventory.set i, itemPile
    else
      console.log 'new empty inventory at ',x,y,z
      bd = {inventory: @chestInventory.toString()}
      @blockdata.set x, y, z, bd

    @activeBlockdata = bd
    console.log 'activeBlockdata 2=',JSON.stringify(@activeBlockdata)

  open: (target) ->
    @chestInventory.clear()

    [x, y, z] = target.voxel
    @loadBlockdata(x, y, z)

    super()

  updateBlockdata: () ->
    console.log 'update with activeBlockdata=',JSON.stringify(@activeBlockdata)
    return if not @activeBlockdata?

    console.log 'chestInventory=',@chestInventory.toString()
    @activeBlockdata.inventory = @chestInventory.toString()

  close: () ->
    delete @activeBlockdata
    super()
