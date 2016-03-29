'use strict';

const InventoryDialog = require('voxel-inventory-dialog').InventoryDialog;
const Inventory = require('inventory');
const InventoryWindow = require('inventory-window');
const ItemPile = require('itempile');

module.exports = (game, opts) => new Chest(game, opts);

module.exports.pluginInfo = {
  loadAfter: ['voxel-blockdata', 'voxel-registry', 'voxel-recipes', 'voxel-carry']
};

class Chest {
  constructor(game, opts) {
    this.game = game;
    if (!game.plugins.get('voxel-carry')) throw new Error('voxel-chest requires "voxel-carry" plugin');
    this.playerInventory = game.plugins.get('voxel-carry').inventory;

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

class ChestDialog extends InventoryDialog {
  constructor(game, playerInventory, registry, blockdata) {
    const chestInventory = new Inventory(10, 3)
    chestInventory.on('changed', () => this.updateBlockdata());
    const chestIW = new InventoryWindow({inventory:chestInventory, registry:registry});

    // allow shift-click to transfer items between these two inventories
    chestIW.linkedInventory = playerInventory;
    //this.playerIW.linkedInventory = this.chestInventory # TODO: need to reach into voxel-inventory-dialog?

    const chestCont = chestIW.createContainer();

    super(game,
      {
        playerLinkedInventory: chestInventory,
        upper: [chestCont]
      });
    this.game = game;
    this.playerInventory = playerInventory;
    this.registry = registry;
    this.blockdata = blockdata;
  }

  loadBlockdata(x, y, z) {
    if (!this.blockdata) {
      console.log('voxel-blockdata not loaded, voxel-chest persistence disabled');
      return;
    }

    let bd = this.blockdata.get(x, y, z);
    console.log('activeBlockdata=',JSON.stringify(bd));
    if (bd) {
      console.log('load existing at ',x,y,z);
      // TODO: better way to 'load' into an inventory than setting all slots?
      const newInventory = Inventory.fromString(bd.inventory)
      console.log('newInventory='+JSON.stringify(newInventory));
      for (let itemPile of newInventory.array) { // TODO: if smaller than current?
        console.log('load chest',i,itemPile);
        this.chestInventory.set(i, itemPile);
      }
    } else {
      console.log('new empty inventory at ',x,y,z);
      bd = {inventory: this.chestInventory.toString()};
      this.blockdata.set(x, y, z, bd);
    }

    this.activeBlockdata = bd;
    console.log('activeBlockdata 2=',JSON.stringify(this.activeBlockdata));
  }

  open(target) {
    this.chestInventory.clear();
    this.loadBlockdata(target.voxel.x, target.voxel.y, target.voxel.z);

    InventoryDialog.open(target);
  }

  updateBlockdata() {
    console.log('update with activeBlockdata=',JSON.stringify(this.activeBlockdata));
    if (!this.activeBlockdata) return;

    console.log('chestInventory=',this.chestInventory.toString());
    this.activeBlockdata.inventory = this.chestInventory.toString();
  }

  close() {
    delete this.activeBlockdata;
    InventoryDialog.close();
  }
}
