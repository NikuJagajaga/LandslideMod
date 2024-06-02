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
var Landslide;
(function (Landslide) {
    Landslide.Cfg = {
        Fall: __config__.getBool("Landslide.Fall"),
        Destroy: __config__.getBool("Landslide.Destroy"),
        Build: __config__.getBool("Landslide.Build"),
        Chain: __config__.getBool("Landslide.Chain"),
        Collapse: __config__.getBool("Collapse")
    };
    var gravityBlocks = {};
    function isGravityBlock(id) {
        return gravityBlocks[id] || false;
    }
    Landslide.isGravityBlock = isGravityBlock;
    function addGravityBlock(id) {
        gravityBlocks[id] = true;
    }
    Landslide.addGravityBlock = addGravityBlock;
    function shuffledSides() {
        var _a;
        var sides = [
            EBlockSide.NORTH,
            EBlockSide.SOUTH,
            EBlockSide.WEST,
            EBlockSide.EAST
        ];
        var j = 0;
        for (var i = sides.length - 1; i > 0; i--) {
            j = Math.random() * (i + 1) | 0;
            _a = [sides[j], sides[i]], sides[i] = _a[0], sides[j] = _a[1];
        }
        return sides;
    }
    Landslide.shuffledSides = shuffledSides;
    function integerCoords(coords) {
        var x = coords.x, y = coords.y, z = coords.z;
        x < 0 && x--;
        z < 0 && z--;
        x |= 0;
        y |= 0;
        z |= 0;
        return { x: x, y: y, z: z };
    }
    Landslide.integerCoords = integerCoords;
    function inside(x, y, z, region) {
        var center = region.getBlock(x, y, z);
        if (World.canTileBeReplaced(center.id, center.data)) {
            var sides = shuffledSides();
            var coords = void 0;
            var neighbour = void 0;
            for (var i = 0; i < sides.length; i++) {
                coords = World.getRelativeCoords(x, y, z, sides[i]);
                neighbour = region.getBlock(coords.x, coords.y, coords.z);
                if (isGravityBlock(neighbour.id)) {
                    region.destroyBlock(coords.x, coords.y, coords.z, false);
                    region.setBlock(x, y, z, neighbour.id, neighbour.data);
                    Landslide.Cfg.Chain && inside(coords.x, coords.y + 1, coords.z, region);
                    break;
                }
            }
        }
    }
    Landslide.inside = inside;
    function outside(x, y, z, region) {
        var center = region.getBlock(x, y, z);
        var under = region.getBlock(x, y - 1, z);
        if (isGravityBlock(center.id) && !World.canTileBeReplaced(under.id, under.data)) {
            var sides = shuffledSides();
            var coords = void 0;
            var neighbour = void 0;
            var neighbourUnder = void 0;
            for (var i = 0; i < sides.length; i++) {
                coords = World.getRelativeCoords(x, y, z, sides[i]);
                neighbour = region.getBlock(coords.x, coords.y, coords.z);
                neighbourUnder = region.getBlock(coords.x, coords.y - 1, coords.z);
                if (World.canTileBeReplaced(neighbour.id, neighbour.data) && World.canTileBeReplaced(neighbourUnder.id, neighbourUnder.data)) {
                    region.destroyBlock(x, y, z, false);
                    region.setBlock(coords.x, coords.y, coords.z, center.id, center.data);
                    break;
                }
            }
        }
    }
    Landslide.outside = outside;
    function collapse(player) {
        var region = BlockSource.getDefaultForActor(player);
        var coords = Landslide.integerCoords(Entity.getPosition(player));
        var block;
        var depth = 2;
        while (true) {
            block = region.getBlock(coords.x, coords.y - depth, coords.z);
            if (!Landslide.isGravityBlock(block.id)) {
                break;
            }
            depth++;
        }
        if (depth > 2 && World.canTileBeReplaced(block.id, block.data)) {
            region.setBlock(coords.x, coords.y - depth, coords.z, 1, 0);
            region.setBlock(coords.x, coords.y - depth, coords.z, block);
        }
    }
    Landslide.collapse = collapse;
})(Landslide || (Landslide = {}));
Landslide.addGravityBlock(VanillaTileID.sand);
Landslide.addGravityBlock(VanillaTileID.gravel);
Landslide.addGravityBlock(VanillaTileID.dragon_egg);
Landslide.addGravityBlock(VanillaTileID.anvil);
Landslide.addGravityBlock(VanillaTileID.concretepowder);
Landslide.Cfg.Destroy && Callback.addCallback("DestroyBlock", function (coords, block, player) {
    Landslide.inside(coords.x, coords.y + 1, coords.z, BlockSource.getDefaultForActor(player));
});
Landslide.Cfg.Build && Callback.addCallback("ItemUse", function (coords, item, block, isExternal, player) {
    Threading.initThread("landslide", function () {
        Landslide.outside(coords.relative.x, coords.relative.y, coords.relative.z, BlockSource.getDefaultForActor(player));
    });
});
Landslide.Cfg.Fall && Callback.addCallback("EntityRemoved", function (entity) {
    if (Entity.getType(entity) === EEntityType.FALLING_BLOCK) {
        var coords = Landslide.integerCoords(Entity.getPosition(entity));
        Landslide.outside(coords.x, coords.y, coords.z, BlockSource.getDefaultForActor(entity));
    }
});
Landslide.Cfg.Collapse && Callback.addCallback("tick", function () {
    for (var _i = 0, _a = Network.getConnectedPlayers(); _i < _a.length; _i++) {
        var player = _a[_i];
        Landslide.collapse(player);
    }
});
ModAPI.registerAPI("LandslideMod", { Landslide: Landslide });
