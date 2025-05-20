import * as THREE from 'three';
import { ImprovedNoise } from '../lib/ImprovedNoise';

export function generateNoiseTexture() {
  // Create noise and save it to texture
  const width = 2048;
  const size = width * width;
  const data = new Uint8Array(size);

  // Zero out height data
  for (let i = 0; i < size; i++) {
    data[i] = Math.floor(Math.random() * 256);
  }

  const noise = new THREE.DataTexture(data, width, width, THREE.AlphaFormat);
  noise.wrapS = THREE.MirroredRepeatWrapping;
  noise.wrapT = THREE.MirroredRepeatWrapping;
  noise.magFilter = THREE.LinearFilter;
  noise.minFilter = THREE.LinearMipMapLinearFilter;
  noise.generateMipmaps = true;
  noise.needsUpdate = true;

  return noise;
}
