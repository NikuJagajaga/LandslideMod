__config__.checkAndRestore({
    enabled: true,
    Landslide: {
        Fall: true,
        Destroy: true,
        Build: true,
        Chain: true
    },
    Collapse: true
});


namespace Landslide {


    export const Cfg = {
        Fall: __config__.getBool("Landslide.Fall"),
        Destroy: __config__.getBool("Landslide.Destroy"),
        Build: __config__.getBool("Landslide.Build"),
        Chain: __config__.getBool("Landslide.Chain"),
        Collapse: __config__.getBool("Collapse")
    };


    const gravityBlocks: {[id: number]: true} = {};


    export function isGravityBlock(id: number): boolean {
        return gravityBlocks[id] || false;
    }


    export function addGravityBlock(id: number): void {
        gravityBlocks[id] = true;
        //World.setBlockChangeCallbackEnabled(id, true);
    }


    export function shuffledSides(): EBlockSide[] {
        
        const sides = [
            EBlockSide.NORTH,
            EBlockSide.SOUTH,
            EBlockSide.WEST,
            EBlockSide.EAST
        ];

        let j = 0;

        for(let i = sides.length - 1; i > 0; i--) {
            j = Math.random() * (i + 1) | 0;
            [sides[i], sides[j]] = [sides[j], sides[i]];
        }

        return sides;

    }


    export function integerCoords(coords: Vector): Vector {
        let {x, y, z} = coords;
        x < 0 && x--;
        z < 0 && z--;
        x |= 0;
        y |= 0;
        z |= 0;
        return {x, y, z};
    }


    export function inside(x: number, y: number, z: number, region: BlockSource): void {

        const center = region.getBlock(x, y, z);

        if(World.canTileBeReplaced(center.id, center.data)){

            const sides = shuffledSides();
            let coords: Vector
            let neighbour: BlockState;

            for(let i = 0; i < sides.length; i++){

                coords = World.getRelativeCoords(x, y, z, sides[i]);
                neighbour = region.getBlock(coords.x, coords.y, coords.z);

                if(isGravityBlock(neighbour.id)){
                    region.destroyBlock(coords.x, coords.y, coords.z, false);
                    region.setBlock(x, y, z, neighbour.id, neighbour.data);
                    Cfg.Chain && inside(coords.x, coords.y + 1, coords.z, region);
                    break;
                }

            }

        }

    }


    export function outside(x: number, y: number, z: number, region: BlockSource): void {

        const center = region.getBlock(x, y, z);
        const under = region.getBlock(x, y - 1, z);

        if(isGravityBlock(center.id) && !World.canTileBeReplaced(under.id, under.data)){

            const sides = shuffledSides();
            let coords: Vector;
            let neighbour: BlockState;
            let neighbourUnder: BlockState;
    
            for(let i = 0; i < sides.length; i++){
    
                coords = World.getRelativeCoords(x, y, z, sides[i]);
                neighbour = region.getBlock(coords.x, coords.y, coords.z);
                neighbourUnder = region.getBlock(coords.x, coords.y - 1, coords.z);

                if(World.canTileBeReplaced(neighbour.id, neighbour.data) && World.canTileBeReplaced(neighbourUnder.id, neighbourUnder.data)){
                    region.destroyBlock(x, y, z, false);
                    region.setBlock(coords.x, coords.y, coords.z, center.id, center.data);
                    break;
                }
    
            }

        }

    }


}


Landslide.addGravityBlock(VanillaTileID.sand);
Landslide.addGravityBlock(VanillaTileID.gravel);
Landslide.addGravityBlock(VanillaTileID.dragon_egg);
Landslide.addGravityBlock(VanillaTileID.anvil);
Landslide.addGravityBlock(VanillaTileID.concretepowder);


Landslide.Cfg.Destroy && Callback.addCallback("DestroyBlock", (coords, block, player) => {
    Landslide.inside(coords.x, coords.y + 1, coords.z, BlockSource.getDefaultForActor(player));
});


Landslide.Cfg.Build && Callback.addCallback("ItemUse", (coords, item, block, isExternal, player) => {
    Threading.initThread("landslide", () => {
        Landslide.outside(coords.relative.x, coords.relative.y, coords.relative.z, BlockSource.getDefaultForActor(player));
    });
});

Landslide.Cfg.Fall && Callback.addCallback("EntityRemoved", (entity) => {
    if(Entity.getType(entity) === EEntityType.FALLING_BLOCK){
        const coords = Landslide.integerCoords(Entity.getPosition(entity));
        Landslide.outside(coords.x, coords.y, coords.z, BlockSource.getDefaultForActor(entity));
    }
});


// Callback.addCallback("LocalTick", () => {

//     const region = BlockSource.getDefaultForActor(Player.get());
//     const coords = Landslide.integerCoords(Player.getPosition());
//     let block: BlockState;
//     let depth = 2;

//     while(true){
//         block = region.getBlock(coords.x, coords.y - depth, coords.z);
//         if(!Landslide.isGravityBlock(block.id)){
//             break;
//         }
//         depth++;
//     }

//     if(depth > 2 && World.canTileBeReplaced(block.id, block.data)){
//         region.setBlock(coords.x, coords.y - depth, coords.z, 1, 0);
//         region.setBlock(coords.x, coords.y - depth, coords.z, block);
//     }

// });



ModAPI.registerAPI("LandslideMod", {Landslide});
