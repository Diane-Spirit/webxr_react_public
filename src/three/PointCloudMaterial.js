// PointCloudMaterial.js
import * as THREE from 'three';

export class PointCloudMaterial extends THREE.ShaderMaterial {
    constructor(pointSize = 25, fixedSize = false, zScale = 5, minZFactor = 0.01) { // Added zScale and minZFactor to constructor
        super({
            vertexShader: `
                uniform float u_point_size;
                uniform float u_fixed_size;
                uniform float u_z_scale;      // Declare uniform
                uniform float u_min_z_factor; // Declare uniform
                
                varying vec4 vColor;
                
                void main() {
                    // The length of the third column vector represents the scale along Z
                    float scaleZ = length(modelMatrix[2].xyz);

                    // Calculate the Z position scaled, but before rotation/translation
                    float scaledLocalZ = position.z * scaleZ;

                    // Calculate world space position
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

                    // Calculate view space position
                    vec4 mvPosition = viewMatrix * worldPosition; // Use worldPosition here
                    
                    // Project point to screen space
                    gl_Position = projectionMatrix * mvPosition;

                    // Pass color to fragment shader
                    vColor = vec4(color.rgb, 1.0);
                   
                    // Point opacity based on distance (Disabled for now)
                    // vColor = vec4(color.rgb, min(1.0, min(1.0, gl_Position.w * 5.0 - 0.5)));
                    
                    // Set point size
                    
                    // Branched implementation for fixed or perspective size
                    if (u_fixed_size > 0.5) { // Use > 0.5 for float comparison
                        gl_PointSize = u_point_size;  // Fixed size
                    } else {
                        // Use uniforms instead of local variables
                        gl_PointSize = u_point_size * (1.0 / gl_Position.w) * (u_min_z_factor + abs(scaledLocalZ) * u_z_scale); 
                    }
                    
                    // Optimized implementation (not working now)
                    // gl_PointSize = u_point_size * (u_fixed_size / gl_Position.w + 1.0 - u_fixed_size);
                }
            `,
            fragmentShader: `
                varying vec4 vColor;
                
                void main() {
                    // Fragment center
                    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                    
                    // Discard fragments outside the circle
                    if (dot(cxy, cxy) > 1.0) discard;
                    
                    // Output color
                    gl_FragColor = vColor;
                }
            `,
            uniforms: {
                u_point_size: { value: pointSize },
                u_fixed_size: { value: fixedSize ? 0.0 : 1.0 },
                u_z_scale: { value: zScale },
                u_min_z_factor: { value: minZFactor },
            },
            vertexColors: true,
            transparent: false, // Set to true if using alpha/opacity
        });
    }

    setPointSize(pointSize) {
        this.uniforms.u_point_size.value = pointSize;
    }

    setFixedSize(fixedSize) {
        this.uniforms.u_fixed_size.value = fixedSize ? 0.0 : 1.0;
    }

    setZScale(zScale) {
        this.uniforms.u_z_scale.value = zScale;
    }

    setMinZFactor(minZFactor) {
        this.uniforms.u_min_z_factor.value = minZFactor;
    }
}