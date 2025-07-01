import { useEffect, useRef } from 'react';
import { PointCloudObject } from '../../three/PointCloudObject.js';
import PropTypes from "prop-types";

function PointCloud({
                        pointCloudRef,
                        pointSize = 25,
                        fixedPointSize = false,
                        position = [0, 0, 0],
                        rotation = [0, 0, 0],
                        scale = 1
}) {
    // Get the scene instances
    const groupRef = useRef(null);

    useEffect(() => {
        // Create a new PointCloud instance
        const pointCloud = new PointCloudObject(pointSize, fixedPointSize);

        // Set the position, rotation, and scale of the point cloud
        pointCloud.getObject().position.set(...position);
        pointCloud.getObject().rotation.set(...rotation);
        pointCloud.getObject().scale.set(scale, scale, scale);

        // Add the point cloud to the scene
        groupRef.current.add(pointCloud.getObject());

        // Save the instance to a ref for access in other parts of the code
        pointCloudRef.current = pointCloud;
    }, [groupRef]);

    return (
        <group ref={groupRef} />
    )
}

PointCloud.propTypes = {
    pointCloudRef: PropTypes.shape({ current: PropTypes.instanceOf(PointCloudObject) }),
    pointSize: PropTypes.number,
    fixedPointSize: PropTypes.bool,
    position: PropTypes.arrayOf(PropTypes.number),
    rotation: PropTypes.arrayOf(PropTypes.number),
    scale: PropTypes.number,
};

export default PointCloud;