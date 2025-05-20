import * as THREE from "three";

const texturePath = "js/textures/";
const sky = new THREE.TextureLoader().load(texturePath + "sky.png");

const texture = {
  sky: sky,
  rock: new THREE.TextureLoader().load(texturePath + "rock.jpg")
};

for (const t in texture) {
  if (texture.hasOwnProperty(t)) {
    texture[t].wrapS = texture[t].wrapT = THREE.RepeatWrapping;
  }
}
sky.wrapS = sky.wrapT = THREE.RepeatWrapping;
sky.flipY = true;
sky.repeat.set(2, 2);

export default texture;

