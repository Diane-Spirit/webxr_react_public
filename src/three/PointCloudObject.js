// PointCloudObject.js
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { PointCloudMaterial } from "./PointCloudMaterial.js";

// Enum-like object for frame conventions
const FRAME_CONVENTIONS = {
    Z_UP_LEFT_HANDED: 'Z_UP_LEFT_HANDED',
    Z_UP_RIGHT_HANDED: 'Z_UP_RIGHT_HANDED',
    Y_UP_LEFT_HANDED: 'Y_UP_LEFT_HANDED',
    Y_UP_RIGHT_HANDED: 'Y_UP_RIGHT_HANDED',
    X_FORWARD_Z_UP_RIGHT_HANDED: 'X_FORWARD_Z_UP_RIGHT_HANDED', // Example extension
};

export class PointCloudObject {
    constructor(pointSize = 25, fixedPointSize = false, frameConvention, frustumCulled = false, zScale = 5, minZFactor = 0.01) {
        this.geometry = new THREE.BufferGeometry();
        this.material = new PointCloudMaterial(pointSize, fixedPointSize, zScale, minZFactor);

        this.points = new THREE.Points(this.geometry, this.material);
        this.points.frustumCulled = frustumCulled;

        this.frameMatrix = this.getFrameMatrix(frameConvention); // Pre-compute matrix
    }

    /**
     * Pre-computes the transformation matrix for the given frame convention.
     */
    getFrameMatrix(convention) {
        const matrix = new THREE.Matrix4();

        switch (convention) {
            case FRAME_CONVENTIONS.Z_UP_LEFT_HANDED:
                // Swap Y and Z: (X, Z, -Y) – typical CAD systems
                matrix.makeRotationX(-Math.PI / 2);
                break;
            case FRAME_CONVENTIONS.Z_UP_RIGHT_HANDED:
                // Same as Z-up left-handed but with X-axis inversion
                matrix.makeRotationX(-Math.PI / 2).scale(new THREE.Vector3(-1, 1, 1));
                break;
            case FRAME_CONVENTIONS.Y_UP_RIGHT_HANDED:
                // Invert X-axis to switch to right-handed Y-up
                matrix.scale(new THREE.Vector3(-1, 1, 1));
                break;
            case FRAME_CONVENTIONS.X_FORWARD_Z_UP_RIGHT_HANDED:
                // Example: Rotate Y to Z, and X forward (common in 3D printing)
                matrix.makeRotationY(Math.PI / 2).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
                break;
            case FRAME_CONVENTIONS.Y_UP_LEFT_HANDED:
            default:
                // Identity (no transformation needed)
                matrix.identity();
                break;
        }

        return matrix;
    }

    /**
     * Applies the pre-computed frame matrix to the point cloud positions.
     */
    applyFrameMatrix(positions) {
        const transformed = new Float32Array(positions.length);
        const vector = new THREE.Vector3();

        for (let i = 0; i < positions.length; i += 3) {
            vector.set(positions[i], positions[i + 1], positions[i + 2]);
            vector.applyMatrix4(this.frameMatrix);
            transformed.set([vector.x, vector.y, vector.z], i);
        }

        return transformed;
    }

    /**
     * Loads a random point cloud with pre-defined frame convention.
     */
    loadRandom(numPoints = 10000) {
        const positions = new Float32Array(numPoints * 3);
        const colors = new Float32Array(numPoints * 4);

        for (let i = 0; i < numPoints; i++) {
            positions.set([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1], i * 3);

            const color = new THREE.Color(Math.random(), Math.random(), Math.random());
            colors.set([color.r, color.g, color.b, 1], i * 3);
        }

        const transformedPositions = this.applyFrameMatrix(positions);
        this.loadFromPoints(transformedPositions, colors);
    }

    /**
     * Decimates the point cloud by selecting a random subset of points.
     */
    decimatePoints(positions, colors, decimationFactor = 0.5) {
        if (decimationFactor === 1) {
            return {positions, colors}
        }

        const numPoints = positions.length / 3;
        const newNumPoints = Math.floor(numPoints * decimationFactor);

        // Log original point number and decimated point number
        // console.log('Original points: ', numPoints);
        // console.log('Decimeted points: ', newNumPoints);

        const decimatedPositions = new Float32Array(newNumPoints * 3);
        const decimatedColors = new Float32Array(newNumPoints * 3);

        for (let i = 0; i < newNumPoints; i++) {
            const randomIndex = Math.floor(Math.random() * numPoints) * 3;

            // Copy positions
            decimatedPositions[i * 3] = positions[randomIndex];
            decimatedPositions[i * 3 + 1] = positions[randomIndex + 1];
            decimatedPositions[i * 3 + 2] = positions[randomIndex + 2];

            // Copy colors
            decimatedColors[i * 3] = colors[randomIndex];
            decimatedColors[i * 3 + 1] = colors[randomIndex + 1];
            decimatedColors[i * 3 + 2] = colors[randomIndex + 2];
        }

        return { decimatedPositions, decimatedColors };
    }

    /**
     * Loads a point cloud from a PLY file with the appropriate frame convention.
     */
    loadFromPLY(file, decimationFactor = 1) {
        const loader = new PLYLoader();
        const reader = new FileReader();

        reader.onload = (event) => {
            const data = event.target.result;
            const geometry = loader.parse(data);

            if (this.points.frustumCulled) {
                geometry.computeBoundingSphere();
            }

            const positions = geometry.getAttribute('position').array;
            const colors = geometry.getAttribute('color')?.array || new Float32Array(positions.length).fill(1);

            // Decimate points
            const {
                decimatedPositions,
                decimatedColors
            } = this.decimatePoints(positions, colors, decimationFactor);

            const transformedPositions = this.applyFrameMatrix(decimatedPositions);
            this.loadFromPoints(transformedPositions, decimatedColors);
        };

        reader.readAsArrayBuffer(file);
    }

    /**
     * Loads the point cloud data into the geometry.
     */
    loadFromPoints(positions, colors) {
        if (positions) {
            // Check if the geometry already has a position attribute ?
            this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            // Update bounding sphere if frustum culling is enabled
            if (this.points.frustumCulled) {
                this.geometry.computeBoundingSphere();
            }
        }
        if (colors) {
            // Check if the geometry already has a color attribute ?
            this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4, true));
        }

        // Update the the material zScale and minZFactor based on the number of points
        const numPoints = positions.length / 3;
        const zScale = Math.max(0.5, 5 - Math.sqrt(numPoints / 10000));
        const minZFactor = Math.min(1, 1000 / numPoints);

        // console.log('zScale:', zScale);
        // console.log('minZFactor:', minZFactor);

        this.material.setZScale(zScale);
        this.material.setMinZFactor(minZFactor);
    }

    /**
     * Returns the THREE.Points object to add to the scene.
     */
    getObject() {
        return this.points;
    }
}

export { FRAME_CONVENTIONS };
