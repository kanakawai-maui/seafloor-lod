import * as THREE from "three";
import { terrainVertexShader } from "../shaders/terrain.vert";
import { terrainFragmentShader } from "../shaders/terrain.frag";
import texture from './texture';


const Edge = {
  NONE: 0,
  TOP: 1,
  LEFT: 2,
  BOTTOM: 4,
  RIGHT: 8
};

  // Terrain is an extension of Object3D and thus can be added directly to the stage
  export class Terrain extends THREE.Object3D {
    constructor(heightData, worldWidth = 1024, levels = 12, resolution = 128) {
      super();

      this.worldWidth = worldWidth;
      this.levels = levels;
      this.resolution = resolution;
      this.heightData = heightData;
      this.z = 0;
      this.tiles = [];



      // Offset is used to re-center the terrain, this way we get the greatest detail
      // nearest to the camera. In the future, should calculate required detail level per tile
      this.offset = new THREE.Vector3(0, 0, 0);

      // Create geometry that we'll use for each tile, just a standard plane
      this.tileGeometry = new THREE.PlaneGeometry(1, 1, this.resolution, this.resolution);
      // Place origin at bottom left corner, rather than center
      const m = new THREE.Matrix4();
      m.makeTranslation(0.5, 0.5, 0);
      this.tileGeometry.applyMatrix4(m);

      // Create collection of tiles to fill required space
      let initialScale = this.worldWidth / Math.pow( 2, levels );

      // Create center layer first
      //    +---+---+
      //    | O | O |
      //    +---+---+
      //    | O | O |
      //    +---+---+
      this.createTile( -initialScale, -initialScale, initialScale, Edge.NONE );
      this.createTile( -initialScale, 0, initialScale, Edge.NONE );
      this.createTile( 0, 0, initialScale, Edge.NONE );
      this.createTile( 0, -initialScale, initialScale, Edge.NONE );

      // Create "quadtree" of tiles, with smallest in center
      // Each added layer consists of the following tiles (marked 'A'), with the tiles
      // in the middle being created in previous layers
      // +---+---+---+---+
      // | A | A | A | A |
      // +---+---+---+---+
      // | A |   |   | A |
      // +---+---+---+---+
      // | A |   |   | A |
      // +---+---+---+---+
      // | A | A | A | A |
      // +---+---+---+---+
      for ( let scale = initialScale; scale < worldWidth; scale *= 2 ) {
        this.createTile( -2 * scale, -2 * scale, scale, Edge.BOTTOM | Edge.LEFT );
        this.createTile( -2 * scale, -scale, scale, Edge.LEFT );
        this.createTile( -2 * scale, 0, scale, Edge.LEFT );
        this.createTile( -2 * scale, scale, scale, Edge.TOP | Edge.LEFT );
  
        this.createTile( -scale, -2 * scale, scale, Edge.BOTTOM );
        // 2 tiles 'missing' here are in previous layer
        this.createTile( -scale, scale, scale, Edge.TOP );
  
        this.createTile( 0, -2 * scale, scale, Edge.BOTTOM );
        // 2 tiles 'missing' here are in previous layer
        this.createTile( 0, scale, scale, Edge.TOP );
  
        this.createTile( scale, -2 * scale, scale, Edge.BOTTOM | Edge.RIGHT );
        this.createTile( scale, -scale, scale, Edge.RIGHT );
        this.createTile( scale, 0, scale, Edge.RIGHT );
        this.createTile( scale, scale, scale, Edge.TOP | Edge.RIGHT );
      }
  }

  setXY(x,y,z) {
    if(this.terrainMaterial) {
      this.terrainMaterial.uniforms.uLightPosition.value = new THREE.Vector3( x, y, z );
    }
    this.terrainMaterial.needsUpdate = true;
  }

  createTile( x, y, scale, edgeMorph ) {
    const localOffset = new THREE.Vector2( x, y );
    const globalOffset = this.offset.clone();
    this.terrainMaterial = this.createTerrainMaterial( this.heightData,
                                                      globalOffset,
                                                      localOffset,
                                                      scale,
                                                      this.resolution, 
                                                      edgeMorph);
    this.plane = new THREE.Mesh( this.tileGeometry, this.terrainMaterial );


    this.tiles.push( this.plane )
    this.add( this.plane );
  }

  updateUniforms() {

    this.offset.x = this.offset.x % this.worldWidth/2;
    this.offset.y = this.offset.y % this.worldWidth/2;

    const pythagoreanOffset = Math.sqrt(this.offset.x ** 2 + this.offset.y ** 2);

    console.log("Pythagorean offset: " + pythagoreanOffset);

    if (pythagoreanOffset >= this.worldWidth/16) {
      console.log("Offset is halfway to the edge of the map");
      this.tiles.forEach(tile => {
        if (tile.material && tile.material.uniforms) {
          console.log("Updating tile material uniforms"); 
          tile.material.uniforms.uGlobalOffset.value = this.position.xy;
          this.offset = this.offset.clone().multiplyScalar(-1);
          tile.material.needsUpdate = true;
        }
      });
      this.plane.material.uniforms.uGlobalOffset.value = this.offset;
      this.plane.material.needsUpdate = true;
    }
  }

  createTerrainMaterial( heightData, globalOffset, localOffset, scale, resolution, edgeMorph ) {

    const terrainMaterial = new THREE.ShaderMaterial( {
      uniforms: {
      uGlobalOffset: { type: "v3", value: globalOffset },
      uHeightData: { type: "t", value: heightData },
      uEdgeMorph: { type: "i", value: edgeMorph },
      uTileOffset: { type: "v2", value: localOffset },
      uScale: { type: "f", value: scale },
      uResolution: { type: "f", value: resolution },
      uLightPosition: { type: "v3", value: new THREE.Vector3( -400, -400, 3000 ) },
      },
      vertexShader: terrainVertexShader.toString(),
      fragmentShader: terrainFragmentShader.toString(),
      transparent: true
    });

    terrainMaterial.extensions.derivatives = true;
    terrainMaterial.extensions.shaderTextureLod = true;



    return terrainMaterial;
  }
}


