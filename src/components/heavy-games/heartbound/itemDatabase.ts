// ============================================================
// Heartbound — Item Database (all collectibles)
// ============================================================
import type { ItemDef } from '../../../types/heartbound.types';

export const ITEM_DATABASE: ItemDef[] = [
  // ── Island 1: Meadow Haven ──────────────────────────────────
  { id:'meadow_flower', name:'Meadow Flower',  description:'A delicate blossom that grows in the sunlit meadows of Meadow Haven.',           type:'flower',   rarity:'common',   icon:'🌸', stackable:true, maxStack:99, islandSrc:1 },
  { id:'wild_daisy',    name:'Wild Daisy',     description:'A cheerful daisy with white petals and a bright yellow centre.',                   type:'flower',   rarity:'common',   icon:'🌼', stackable:true, maxStack:99, islandSrc:1 },
  { id:'honeycomb',     name:'Honeycomb',      description:'Sweet, golden honeycomb harvested from the meadow beehives.',                    type:'material', rarity:'uncommon', icon:'🍯', stackable:true, maxStack:20, islandSrc:1 },
  { id:'river_bass',    name:'River Bass',     description:'A silvery fish from Meadow Haven\'s tranquil lake. Good eating.',                type:'fish',     rarity:'common',   icon:'🐟', stackable:true, maxStack:20, islandSrc:1 },
  { id:'golden_carp',   name:'Golden Carp',    description:'A rare shimmering carp. Said to bring good luck to those who catch it.',         type:'fish',     rarity:'rare',     icon:'🐠', stackable:true, maxStack:5,  islandSrc:1 },
  { id:'ancient_relic', name:'Ancient Relic',  description:'A worn stone tablet etched with symbols of an old civilisation.',               type:'key_item', rarity:'rare',     icon:'🪨', stackable:false,maxStack:1,  islandSrc:1 },
  { id:'lore_scroll',   name:'Lore Scroll',    description:'A scroll containing a fragment of Meadow Haven\'s history.',                    type:'key_item', rarity:'uncommon', icon:'📜', stackable:true, maxStack:10, islandSrc:1 },
  { id:'meadow_seed',   name:'Meadow Seed',    description:'A seed that can be planted in The Heartland to grow a Meadow Flower.',          type:'material', rarity:'common',   icon:'🌱', stackable:true, maxStack:50, islandSrc:1 },
  // ── Cookable food (any island) ──────────────────────────────
  { id:'honey_tart',    name:'Honey Tart',     description:'A warm tart made from honeycomb. Restores stamina and grants Bond XP.',         type:'food',     rarity:'uncommon', icon:'🥧', stackable:true, maxStack:5,  islandSrc:null },
  { id:'wildflower_tea',name:'Wildflower Tea', description:'A calming herbal tea. Share with your partner for double Bond XP.',             type:'food',     rarity:'common',   icon:'🍵', stackable:true, maxStack:10, islandSrc:null },
  // ── Furniture (starter set — full set unlocked across islands)
  { id:'wooden_bench',  name:'Wooden Bench',   description:'A simple bench. Perfect for watching sunsets together.',                        type:'furniture',rarity:'common',   icon:'🪑', stackable:false,maxStack:4,  islandSrc:null },
  { id:'flower_pot',    name:'Flower Pot',     description:'A terracotta pot. Plant any flower seed in it for your home.',                  type:'furniture',rarity:'common',   icon:'🪴', stackable:false,maxStack:8,  islandSrc:null },
  { id:'lantern',       name:'Lantern',        description:'A warm lantern that glows at night. A must for any island home.',               type:'furniture',rarity:'common',   icon:'🏮', stackable:false,maxStack:10, islandSrc:null },
  { id:'picnic_basket', name:'Picnic Basket',  description:'A woven basket full of treats. Unlocks the couple picnic interaction.',        type:'furniture',rarity:'uncommon', icon:'🧺', stackable:false,maxStack:2,  islandSrc:null },
];

export function getItem(id: string): ItemDef | undefined {
  return ITEM_DATABASE.find(i => i.id === id);
}

export function getItemsByType(type: ItemDef['type']): ItemDef[] {
  return ITEM_DATABASE.filter(i => i.type === type);
}

export function getItemsByIsland(islandId: number): ItemDef[] {
  return ITEM_DATABASE.filter(i => i.islandSrc === islandId);
}
