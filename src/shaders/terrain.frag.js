
const shader = `
uniform float uScale;
uniform vec3 uLightPosition;
uniform sampler2D uHeightData;

varying float vMorphFactor;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vResolution;

vec3 colorForScale(float scale) {
  if ( scale > 32.0 ) {
    scale /= 32.0;
  }
  if ( scale <= 1.0 ) {
    return vec3(0.1, 0.3, 0.5);
  } else if ( scale <= 2.0 ) {
    return vec3(0.1, 0.3, 0.5);
  } else if ( scale <= 4.0 ) {
    return vec3(0.1, 0.3, 0.5);
  } else if ( scale <= 8.0 ) {
    return vec3(0.1, 0.3, 0.1);
  } else if ( scale <= 16.0 ) {
    return vec3(0.1, 0.3, 0.1);
  } else if ( scale <= 32.0 ) {
    return vec3(0.1, 0.3, 0.1);
  }

  // Shouldn't happen
  return vec3(0.1, 0.3, 0.9);
}

float getHeight(vec3 p) {
  vec2 st = p.xy / (vResolution);

  // Sample multiple times to get more detail out of map
  float h = vResolution * textureLod(uHeightData, st, 0.0).a;
  h += (vResolution / 4.0) * textureLod(uHeightData, 16.0 * st, 0.0).a;
  h += (vResolution / 32.0) * textureLod(uHeightData, 256.0 * st, 0.0).a;

  // Square the height, leads to more rocky looking terrain
  return h * h / 2000.0;
}

vec3 getNormal() {
  // Differentiate the position vector (this will give us two vectors perpendicular to the surface)
  // Before differentiating, add the displacement based on the height from the height map. By doing this
  // calculation here, rather than in the vertex shader, we get a per-fragment calculated normal, rather
  // than a per-vertex normal. This improves the look of distant low-vertex terrain.
  float height = getHeight( vPosition );
  vec3 p = vec3( vPosition.xy, height );
  vec3 dPositiondx = dFdx(p);
  vec3 dPositiondy = dFdy(p);

  // The normal is the cross product of the differentials
  return normalize(cross(dPositiondx, dPositiondy));
}


void main() {
  // Base color
  vec3 light = uLightPosition;
  vec3 color = colorForScale(uScale);
  //vec3 color = vec3(0.27, 0.18, 0.77);
  color = vec3(vMorphFactor);

  vec3 normal = vNormal;

  // Incident light
  float incidence = dot(normalize(light - vPosition), normal);
  incidence = clamp(incidence, 0.0, 1.0);
  incidence = pow(incidence, 0.05);
  color = mix(vec3(0.9, 0.1, 0.3), color, incidence);

  // Mix in specular light
  vec3 halfVector = normalize(normalize(cameraPosition - vPosition) + normalize(light - vPosition));
  float specular = dot(normal, halfVector);
  specular = max(0.0, specular);
  specular = pow(specular, 2.0);
  color = mix(color, vec3(0.05, 0.4, 1.0), 0.5 * specular);

  vec3 light3 = vec3(0.0, 50.0, 1500.0);
  halfVector = normalize(normalize(cameraPosition - vPosition) + normalize(light3 - vPosition));
  specular = dot(normal, halfVector);
  specular = max(0.0, specular);
  specular = pow(specular, 70.0);
  color = mix(color, vec3(0.2, 0.5, 0.9), specular);

  // Add rays from the top
  vec3 topLight = vec3(10.0, 1000.0, 100000.0);
  vec3 topHalfVector = normalize(normalize(cameraPosition - vPosition) + normalize(topLight - vPosition));
  float topSpecular = dot(normal, topHalfVector);
  topSpecular = max(0.0, topSpecular);
  topSpecular = pow(topSpecular, 20.0);
  color = mix(color, vec3(1.0, 1.0, 1.0), topSpecular);

  // Add additional specular highlights
  vec3 extraLight1 = vec3(-500.0, 200.0, 1400.0);
  vec3 extraHalfVector1 = normalize(normalize(cameraPosition - vPosition) + normalize(extraLight1 - vPosition));
  float extraSpecular1 = dot(normal, extraHalfVector1);
  extraSpecular1 = max(0.0, extraSpecular1);
  extraSpecular1 = pow(extraSpecular1, 10.0);
  color = mix(color, vec3(0.2, 0.3, 0.8), extraSpecular1);

  vec3 extraLight2 = vec3(300.0, -100.0, 1600.0);
  vec3 extraHalfVector2 = normalize(normalize(cameraPosition - vPosition) + normalize(extraLight2 - vPosition));
  float extraSpecular2 = dot(normal, extraHalfVector2);
  extraSpecular2 = max(0.0, extraSpecular2);
  extraSpecular2 = pow(extraSpecular2, 15.0);
  color = mix(color, vec3(0.1, 0.4, 0.9), extraSpecular2);


  gl_FragColor = vec4(color, 0.97);
}
`;

export { shader as terrainFragmentShader };