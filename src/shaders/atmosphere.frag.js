const shader = `
uniform vec3 uHorizonColor;
uniform vec3 uSkyColor;

varying float vDistance;

void main() {
  // Not the best gradient effect....
  float blend = smoothstep( 0.0, 1500.0, gl_FragCoord.y );
  vec3 color = mix( uHorizonColor, uSkyColor, blend );

  // Apply an underwater effect by adding a blue tint based on distance
  float underwaterBlend = smoothstep( 0.0, 10.0, vDistance );
  color = mix( color, vec3(0.0, 0.2, 0.9), underwaterBlend );
  gl_FragColor = vec4( color, 0.1);
}
`;

export { shader as atmosphereFragmentShader };