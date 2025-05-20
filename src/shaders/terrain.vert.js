

const shader = `       
uniform vec3 uGlobalOffset;
uniform sampler2D uHeightData;
uniform vec2 uTileOffset;
uniform float uScale;
uniform int uEdgeMorph;

uniform float uResolution;


varying vec3 vNormal;


varying float vResolution;

varying vec3 vPosition;
varying float vMorphFactor;

#define EDGE_MORPH_TOP 1
#define EDGE_MORPH_LEFT 2
#define EDGE_MORPH_BOTTOM 4
#define EDGE_MORPH_RIGHT 8

// Hash function for noise
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

// Perlin noise function
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);

  // Smoothstep interpolation
  vec3 u = f * f * (3.0 - 2.0 * f);

  // Hash function
  float n = dot(i, vec3(1.0, 57.0, 113.0));
  float res = mix(
    mix(
      mix(hash(n + 0.0), hash(n + 1.0), u.x),
      mix(hash(n + 57.0), hash(n + 58.0), u.x),
      u.y
    ),
    mix(
      mix(hash(n + 113.0), hash(n + 114.0), u.x),
      mix(hash(n + 170.0), hash(n + 171.0), u.x),
      u.y
    ),
    u.z
  );

  return res;
}

float getHeight(vec3 p) {
  float lod = log2(uScale) - 6.0;
  vec2 st = p.xy / 1024.0;

  float h = 1024.0 * textureLod(uHeightData, st, 0.0).r;
  h += 64.0 * textureLod(uHeightData, 16.0 * st, 0.0).r;
  h += 4.0 * textureLod(uHeightData, 256.0 * st, 0.0).r;

  return pow(h, 1.5) / 20.0;
}

vec3 getNormal() {
  vec3 initialNormal = normal;

  float delta = (vMorphFactor + 1.0) * uScale / uResolution;
  vec3 dA = delta * normalize(cross(initialNormal.yzx, initialNormal));
  vec3 dB = delta * normalize(cross(dA, initialNormal));
  vec3 p = vPosition;
  vec3 pA = vPosition + dA;
  vec3 pB = vPosition + dB;

  float h = getHeight(vPosition);
  float hA = getHeight(pA);
  float hB = getHeight(pB);

  p += initialNormal * h;
  pA += initialNormal * hA;
  pB += initialNormal * hB;
  return normalize(cross(pB - p, pA - p));
}

// Poor man's bitwise &
bool edgePresent(int edge) {
  return (uEdgeMorph & edge) != 0;
}

#define MORPH_REGION 0.1

// At the edges of tiles morph the vertices, if they are joining onto a higher layer
float calculateMorph(vec3 p) {
  float morphFactor = 0.0;
  if (edgePresent(EDGE_MORPH_TOP) && p.y >= 1.0 - MORPH_REGION) {
    morphFactor = max(1.0 - clamp((1.0 - p.y) / MORPH_REGION, 0.0, 1.0), morphFactor);
  }
  if (edgePresent(EDGE_MORPH_LEFT) && p.x <= MORPH_REGION) {
    morphFactor = max(1.0 - clamp(p.x / MORPH_REGION, 0.0, 1.0), morphFactor);
  }
  if (edgePresent(EDGE_MORPH_BOTTOM) && p.y <= MORPH_REGION) {
    morphFactor = max(1.0 - clamp(p.y / MORPH_REGION, 0.0, 1.0), morphFactor);
  }
  if (edgePresent(EDGE_MORPH_RIGHT) && p.x >= 1.0 - MORPH_REGION) {
    morphFactor = max(1.0 - clamp((1.0 - p.x) / MORPH_REGION, 0.0, 1.0), morphFactor);
  }

  return smoothstep(0.0, 10.0, morphFactor);
}

void main() {
  vMorphFactor = calculateMorph(position);

  vPosition = uScale * position + vec3(uTileOffset, 0.0) + uGlobalOffset;

  float grid = uScale / uResolution;
  vPosition = floor(vPosition / grid) * grid;

  if (vMorphFactor > 0.0) {
    grid = 2.0 * grid * (uScale / uResolution);
    vec3 position2 = floor(vPosition / grid) * grid;
    vPosition = mix(vPosition, position2, vMorphFactor);
  }

  // Randomly perturb vPosition.z with hills
  float hillFrequency = 0.0005 * log2((uScale / uResolution));
  float hillAmplitude = 30.0 * log2(uScale / uResolution);
  vPosition.x += hillAmplitude * sin(vPosition.x * hillFrequency) * cos(vPosition.x * hillFrequency);
  vPosition.y += hillAmplitude * sin(vPosition.y * hillFrequency) * cos(vPosition.y * hillFrequency);
  vPosition.z += hillAmplitude * sin(vPosition.x * hillFrequency) * cos(vPosition.y * hillFrequency);

  float hillFrequency2 = 0.003 * log2((uScale / uResolution));
  float hillAmplitude2 = 3.0 * log2(uScale / uResolution);
  vPosition.x += hillAmplitude2 * sin(vPosition.x * hillFrequency2) * cos(vPosition.x * hillFrequency2);
  vPosition.y += hillAmplitude2 * sin(vPosition.y * hillFrequency2) * cos(vPosition.y * hillFrequency2);
  vPosition.z += hillAmplitude2 * sin(vPosition.x * hillFrequency2) * cos(vPosition.y * hillFrequency2);

  // Add Perlin noise
  float perlinFrequency = 0.9 * log2((uScale / uResolution));
  float perlinAmplitude = 20.0;
  vPosition.z += perlinAmplitude * noise(vec3(vPosition.xy * perlinFrequency, 0.0));

  vPosition = vPosition + normal;
  
  vNormal = getNormal();
  // Add Perlin noise to the normal
  float normalNoiseFrequency = 0.4 * log2((uScale / uResolution));
  float normalNoiseAmplitude = 0.06;
  vNormal += normalNoiseAmplitude * vec3(
    noise(vec3(vPosition.xy * normalNoiseFrequency, 0.0)),
    noise(vec3(vPosition.yz * normalNoiseFrequency, 0.0)),
    noise(vec3(vPosition.zx * normalNoiseFrequency, 0.0))
  );
  vNormal = normalize(vNormal);

   vNormal = getNormal();
  // Add Perlin noise to the normal
  float normalNoiseFrequency2 = 0.9 * log2((uScale / uResolution));
  float normalNoiseAmplitude2 = 0.05;
  vNormal += normalNoiseAmplitude2 * vec3(
    noise(vec3(vPosition.xy * normalNoiseFrequency2, 0.0)),
    noise(vec3(vPosition.yz * normalNoiseFrequency2, 0.0)),
    noise(vec3(vPosition.zx * normalNoiseFrequency2, 0.0))
  );
  vNormal = normalize(vNormal);
  
  vResolution = uResolution;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);

}
`;

export { shader as terrainVertexShader };