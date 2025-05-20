const shader = `
varying float vDistance;

void main() {
  // Calculate distance from the camera to the vertex
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export { shader as atmosphereVertexShader };