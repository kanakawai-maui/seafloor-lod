import { Detector } from './lib/detector.js';
import { App } from './app/app.js';
import container from './app/container.js';

// Start the app
function startup() {
  const detector = new Detector();
  console.log("Starting up the app...", detector.webgl);
  // Check if WebGL is supported
  if (!detector.webgl) {
    detector.addGetWebGLMessage();
    container.innerHTML = "";
  }

  const app = new App();
  // Initialize our app and start the animation loop
  app.init();
  console.log("App initialized");
  app.animate();
  console.log("App animating");
}

// Automatically run the startup function when the script is loaded
document.addEventListener('DOMContentLoaded', () => {
  startup();
});

// Export the startApp function as part of the module
export { startup };
