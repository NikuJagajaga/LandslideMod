const Landslide = {

    chain: __config__.getBool("Landslide.Chain"),

    coords: [
        {x: 0, z: -1},
        {x: 0, z: 1},
        {x: -1, z: 0},
        {x: 1, z: 0}
    ],

    blocks: {
        12: true,//sand
        13: true,//gravel
        122: true,//dragon_egg
        145: true,//anvil
        237: true//concrete_powder
    },

    randomDir: function(){
        const array = [0, 1, 2, 3];
        let j = 0;
        for(let i = 3; i > 0; i--) {
            j = Math.random() * (i + 1) | 0;
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    integerCoords: function(coords){
        coords.x < 0 && coords.x--;
        coords.z < 0 && coords.z--;
        coords.x |= 0;
        coords.y |= 0;
        coords.z |= 0;
        return coords;
    },

    inside: function(coords){
        const dirs = this.randomDir();
        let x = z = 0;
        let air, block;
        for(let i = 0; i < 4; i++){
            x = coords.x + this.coords[dirs[i]].x;
            z = coords.z + this.coords[dirs[i]].z;
            air = World.getBlock(coords.x, coords.y, coords.z);
            block = World.getBlock(x, coords.y, z);
            if(World.canTileBeReplaced(air.id, air.data) && this.blocks[block.id]){
                World.setFullBlock(coords.x, coords.y, coords.z, block);
                World.destroyBlock(x, coords.y, z);
                this.chain && this.inside({x: x, y: coords.y + 1, z: z});
                break;
            }
        }
    },

    outside: function(coords){
        let block = World.getBlock(coords.x, coords.y - 1, coords.z);
        if(World.canTileBeReplaced(block.id, block.data)){
            return;
        }
        const dirs = this.randomDir();
        let x = z = 0;
        let air1, air2;
        for(let i = 0; i < 4; i++){
            x = coords.x + this.coords[dirs[i]].x;
            z = coords.z + this.coords[dirs[i]].z;
            block = World.getBlock(coords.x, coords.y, coords.z);
            air1 = World.getBlock(x, coords.y, z);
            air2 = World.getBlock(x, coords.y - 1, z);
            if(this.blocks[block.id] && World.canTileBeReplaced(air1.id, air1.data) && World.canTileBeReplaced(air2.id, air2.data)){
                World.setFullBlock(x, coords.y, z, block);
                World.destroyBlock(coords.x, coords.y, coords.z);
                break;
            }
        }
    },

    setup: function(){
        for(let id in this.blocks){
            World.setBlockChangeCallbackEnabled(id - 0, true);
        }
    }

};

/*
Callback.addCallback("PostLoaded", function(){
    Landslide.setup();
});

Callback.addCallback("BlockChanged", function(coords, oldBlock, newBlock){
    new java.lang.Thread(function(){
        if(World.canTileBeReplaced(oldBlock.id, oldBlock.data) && Landslide.blocks[newBlock.id]){
            Landslide.outside(coords);
        }
    }).start();
});
*/

__config__.getBool("Landslide.Build") && Callback.addCallback("ItemUse", function(coords, item){
    if(Landslide.blocks[item.id]){
        new java.lang.Thread(function(){
            Landslide.outside(coords.relative);
        }).start();
    }
});

__config__.getBool("Landslide.Fall") && Callback.addCallback("EntityRemoved", function(ent){
    if(Entity.getType(ent) === Native.EntityType.FALLING_BLOCK){
        Landslide.outside(Landslide.integerCoords(Entity.getPosition(ent)));
    }
});

__config__.getBool("Landslide.Destroy") && Callback.addCallback("DestroyBlock", function(coords, block){
    if(Landslide.blocks[block.id]){
        coords.y++;
        Landslide.inside(coords);
    }
});

__config__.getBool("Collapse") && Callback.addCallback("LevelLoaded", function(){
    Updatable.addUpdatable({
        update: function(){
            const pos = Landslide.integerCoords(Player.getPosition());
            pos.y -= 2;
            if(Landslide.blocks[World.getBlockID(pos.x, pos.y, pos.z)]){
                while(Landslide.blocks[World.getBlockID(pos.x, --pos.y, pos.z)]);
                if(World.canTileBeReplaced(World.getBlockID(pos.x, pos.y, pos.z))){
                    World.setBlock(pos.x, pos.y, pos.z, 1, 0);
                    World.setBlock(pos.x, pos.y, pos.z, 0, 0);
                }
            }
        }
    });
});