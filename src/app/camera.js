import * as THREE from 'three';
import container from './container';

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100000);

camera.up = new THREE.Vector3(0, 0, 1);

const updateSize = () => {
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();
};

window.addEventListener('resize', updateSize, false);
updateSize();

export default camera;
