import * as THREE from "three";
import { atmosphereVertexShader } from "../shaders/atmosphere.vert";
import { atmosphereFragmentShader } from "../shaders/atmosphere.frag";
import textures from "./texture";

const material = {
  atmosphere: new THREE.ShaderMaterial({
    uniforms: {
      uHorizonColor: { type: "c", value: new THREE.Color(0xfff1d8) },
      uSkyColor: { type: "c", value: new THREE.Color(0xf9f9ff) },
    },
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    side: THREE.BackSide,
  }),
  sky: new THREE.MeshBasicMaterial({
    map: textures.sky,
    side: THREE.BackSide,
  })
}

export default material;