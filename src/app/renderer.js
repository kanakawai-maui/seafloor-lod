import * as THREE from 'three';

class Renderer {
  constructor(container) {
    if (!(container instanceof HTMLElement)) {
      throw new Error("Invalid container: must be a DOM element.");
    }
    this.container = container;
    this.container.innerHTML = "";
    this.core = new THREE.WebGLRenderer({ antialias: true });
    this.core.setClearColor(0x000000);
    this.core.sortObjects = false;
    this.core.autoClear = false;
    this.container.appendChild(this.core.domElement);

    this.updateSize = this.updateSize.bind(this);
    window.addEventListener('resize', this.updateSize, false);
    this.updateSize();
    
  }

  render(scene, camera) {
    this.core.render(scene, camera);
  }

  updateSize() {
    this.core.setSize(this.container.offsetWidth, this.container.offsetHeight);

    // For a smoother render double the pixel ratio
    this.core.setPixelRatio(2);
  }

  dispose() {
    window.removeEventListener('resize', this.updateSize);
    this.container.innerHTML = "";
  }
}

export { Renderer };