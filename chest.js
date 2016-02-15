'use strict';

const InventoryDialog = require('voxel-inventory-dialog').InventoryDialog;
const Inventory = require('inventory');
const InventoryWindow = require('inventory-window');
const ItemPile = require('itempile');

module.exports = (game, opts) => return new Chest(game, opts);

module.exports.pluginInfo = {
  loadAfter: ['voxel-blockdata', 'voxel-registry', 'voxel-recipes', 'voxel-carry']
};

class Chest {
  constructor(game, opts) {
    this.game = game;
    if (!game.plugins.get('voxel-carry')) throw new Error('voxel-chest requires "voxel-carry" plugin');
    playerInventory = game.plugins.get('voxel-carry').inventory;

    this.registry = game.plugins.get('voxel-registry') ? game.plugins.get('voxel-registry') : undefined;
    this.recipes = game.plugins.get('voxel-recipes') ? game.plugins.get('voxel-recipes') : undefined;
    this.blockdata = game.plugins.get('voxel-blockdata') ? game.plugins.get('voxel-blockdata') : undefined;

    if (!('registerBlock' in opts)) opts.registerBlock = this.registry !== undefined;
    if (!('registerRecipe' in opts)) opts.registerRecipe = this.recipes !== undefined;
   
    this.chestDialog = new ChestDialog(game, this.playerInventory, this.registry, this.blockdata);

    this.opts = opts;
    this.enable();
  }

  enable() {
    if (this.opts.registerBlock) {
      // TODO: chest textures? not in current tp..
      this.registry.registerBlock('chest', {texture: ['door_wood_lower', 'piston_top_normal', 'bookshelf'], onInteract: (target) => {
        // TODO: server-side?
        this.chestDialog.open(target);
        return true;
      }});
    }

    if (this.opts.registerRecipe) {
      this.recipes.registerPositional([
        ['wood.plank', 'wood.plank', 'wood.plank'],
        ['wood.plank', undefined, 'wood.plank'],
        ['wood.plank', 'wood.plank', 'wood.plank']],
        new ItemPile('chest', 1));
    }
  }

  disable() {
  }
}

// TODO: port the rest
class ChestDialog extends InventoryDialog {
  constructor(this.game, this.playerInventory, this.registry, this.blockdata) {

    super game,
      playerLinkedInventory: this.chestInventory
      upper: [chestCont]

  static setup(opts) {
    this.chestInventory = new Inventory(10, 3)
    this.chestInventory.on 'changed', () => this.updateBlockdata()
    this.chestIW = new InventoryWindow {inventory:this.chestInventory, registry:this.registry}

    # allow shift-click to transfer items between these two inventories
    this.chestIW.linkedInventory = this.playerInventory
    #this.playerIW.linkedInventory = this.chestInventory # TODO: need to reach into voxel-inventory-dialog?

    chestCont = this.chestIW.createContainer()


  }

  loadBlockdata: (x, y, z) -> {
    if not this.blockdata?
      console.log 'voxel-blockdata not loaded, voxel-chest persistence disabled'
      return

    bd = this.blockdata.get x, y, z
    console.log 'activeBlockdata=',JSON.stringify(bd)
    if bd?
      console.log 'load existing at ',x,y,z
      # TODO: better way to 'load' into an inventory than setting all slots?
      newInventory = Inventory.fromString(bd.inventory)
      console.log 'newInventory='+JSON.stringify(newInventory)
      for itemPile, i in newInventory.array  # TODO: if smaller than current?
        console.log 'load chest',i,itemPile
        this.chestInventory.set i, itemPile
    else
      console.log 'new empty inventory at ',x,y,z
      bd = {inventory: this.chestInventory.toString()}
      this.blockdata.set x, y, z, bd

    this.activeBlockdata = bd
    console.log 'activeBlockdata 2=',JSON.stringify(this.activeBlockdata)

  open: (target) -> {
    this.chestInventory.clear()

    [x, y, z] = target.voxel
    this.loadBlockdata(x, y, z)

    super()

  updateBlockdata: () -> {
    console.log 'update with activeBlockdata=',JSON.stringify(this.activeBlockdata)
    return if not this.activeBlockdata?

    console.log 'chestInventory=',this.chestInventory.toString()
    this.activeBlockdata.inventory = this.chestInventory.toString()

  close: () -> {
    delete this.activeBlockdata
    super()
