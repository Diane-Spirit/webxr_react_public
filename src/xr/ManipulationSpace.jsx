import {useContext, useEffect, useRef, useState} from "react";
import {useFrame} from "@react-three/fiber";
import {
    useXR,
    useXRInputSourceEvent,
    useXRInputSourceState,
} from "@react-three/xr";
import {Quaternion, Vector3} from "three";
import {ControllerSpaceContext} from "./ControllerSpace.jsx";

/*
LIMITATIONS:
- Strange behavior when origin of the object is behind the camera
 */

function ManipulationSpace({
                               initialPosition = [0, 0, 0],
                               initialRotation = [0, 0, 0],
                               initialScale = 1,
                               children
                           }) {
    const groupRef = useRef(null);

    const {contentRef} = useContext(ControllerSpaceContext);

    const [leftGrip, setLeftGrip] = useState(false);
    const [rightGrip, setRightGrip] = useState(false);

    // Input source space for left input source
    const leftControllerState = useXRInputSourceState('controller', 'left');
    const leftHandState = useXRInputSourceState('hand', 'left');
    const leftInputSource = leftControllerState?.inputSource ?? leftHandState?.inputSource;

    // Input source space for right input source
    const rightControllerState = useXRInputSourceState('controller', 'right');
    const rightHandState = useXRInputSourceState('hand', 'right');
    const rightInputSource = rightControllerState?.inputSource ?? rightHandState?.inputSource;

    // Is grabbing
    const [grabbing, setGrabbing] = useState(false);

    // TODO: ENABLE DISABLE?

    const handleEvent = (event) => {
        setGrabbing(false);
        switch (event.inputSource.handedness) {
            case 'left':
                setLeftGrip(event.type.includes('start'));
                break;
            case 'right':
                setRightGrip(event.type.includes('start'));
                break;
            default:
                break;
        }
    }

    useEffect(() => {
        const event = new CustomEvent('grab', {
            detail: {
                left: leftGrip, right: rightGrip
            }
        });
        window.dispatchEvent(event);
    }, [grabbing, leftGrip, rightGrip]);

    // Controller events
    useXRInputSourceEvent('all', 'squeezestart', handleEvent, []);
    useXRInputSourceEvent('all', 'squeezeend', handleEvent, []);

    // Hand events
    useXRInputSourceEvent('all', 'selectstart', handleEvent, []);
    useXRInputSourceEvent('all', 'selectend', handleEvent, []);

    // TODO: CHECK THIS
    const state = useXR();
    const origin = state.originReferenceSpace;

    const pointToVector3 = (point) => {
        return new Vector3(point.x, point.y, point.z)
    }

    const getPosition = (frame, space, baseSpace = origin) => {
        return pointToVector3(frame.getPose(space, baseSpace).transform.position);
    }

    const getViewerPosition = (frame, baseSpace = origin) => {
        return pointToVector3(frame.getViewerPose(baseSpace).transform.position);
    }

    const calculateMidpoint = (left, right) => {
        return new Vector3(
            (right.x + left.x) / 2,
            (right.y + left.y) / 2,
            (right.z + left.z) / 2
        );
    }

    const calculateOffset = (left, right) => {
        return new Vector3(
            right.x - left.x,
            right.y - left.y,
            right.z - left.z
        );
    }

    // Positions at the start of the grab
    const [startingOffset, setStartingOffset] = useState(null);
    // const [startingMidpoint, setStartingMidpoint] = useState(null);

    const [startingRotationOffset, setStartingRotationOffset] = useState(null);
    const [startingScaleOffset, setStartingScaleOffset] = useState(null);

    // const [startingViewerPosition, setStartingViewerPosition] = useState(null);

    // Starting transform of manipulated object
    const [startingTransform, setStartingTransform] = useState(null);

    useFrame(({gl}) => {
        // Read the input and calculate grabbing etc
        if (leftGrip && rightGrip) {

            // Get current XRFrame
            const frame = gl.xr.getFrame();

            if (!leftInputSource || !rightInputSource || !leftInputSource.targetRaySpace || !rightInputSource.targetRaySpace) {
                console.warn('No input source or target ray space found');
                return;
            }

            // Get the starting positions of the left and right input sources
            const left = getPosition(frame, leftInputSource.targetRaySpace);
            const right = getPosition(frame, rightInputSource.targetRaySpace);

            // Calculate the current offset and midpoint
            const currentOffset = calculateOffset(left, right);
            const currentMidpoint = calculateMidpoint(left, right);

            // Get viewer position
            const viewerPosition = getViewerPosition(frame);
            viewerPosition.setComponent(1, 1.3);


            if (!grabbing) {
                // Start grabbing
                setGrabbing(true);

                // Group position in world space
                const groupWorldPosition = new Vector3();
                groupRef.current.getWorldPosition(groupWorldPosition);

                // Set starting transform
                setStartingTransform({
                    position: groupRef.current.position.clone(),
                    scale: groupRef.current.scale.clone(),
                    quaternion: groupRef.current.quaternion.clone(),
                })

                // Calculate the starting offset and midpoint
                setStartingOffset(currentOffset);
                // setStartingMidpoint(currentMidpoint);

                // Set the starting viewer position
                // setStartingViewerPosition(viewerPosition);

                // Calculate vectors in the viewer space
                const groupPosition = groupWorldPosition.clone().sub(viewerPosition);
                const midpointPosition = currentMidpoint.clone().sub(viewerPosition);

                // Calculate the starting scale offset
                setStartingScaleOffset(groupPosition.length() / midpointPosition.length());

                // Calculate the starting rotation offset
                setStartingRotationOffset(new Quaternion()
                    .setFromUnitVectors(
                        midpointPosition.normalize(),
                        groupPosition.normalize()
                    )
                );
            } else {

                // TODO: CALCULATE POSITION RELATIVE TO CAMERA TO ENABLE ROTATION AROUND CAMERA
                // Calculate the position
                // - Start from current midpoint
                // - Rotate by the starting rotation offset
                // - Scale by the starting scale offset
                // ?? - Translate by the viewer position ??
                const position = currentMidpoint
                    .clone()
                    .sub(viewerPosition)
                    .multiplyScalar(startingScaleOffset)
                    .applyQuaternion(startingRotationOffset)
                    .add(viewerPosition)
                    .applyMatrix4(groupRef.current.parent.matrixWorld.invert());

                // console.log('Current Midpoint', currentMidpoint);
                // console.log('Viewer Position', viewerPosition);
                // console.log('Scale Offset', startingScaleOffset);
                // console.log('Rotation Offset', startingRotationOffset);
                // console.log('Parent Transform', startingTransform.parentPosition);
                // console.log('Position', position);

                // Calculate the scale factor
                const scale = startingTransform.scale
                    .clone()
                    .multiplyScalar(currentOffset.length() / startingOffset.length());

                // Calculate the rotation
                const rotation = new Quaternion()
                    .setFromUnitVectors(
                        startingOffset.clone().normalize(),
                        currentOffset.clone().normalize()
                    )
                    .multiply(startingTransform.quaternion);

                // Apply the transformation
                groupRef.current.position.copy(position);
                groupRef.current.scale.copy(scale);
                groupRef.current.quaternion.copy(rotation);
            }
        }
    });

    return (
        <group
            position={initialPosition}
            rotation={initialRotation}
            scale={[initialScale, initialScale, initialScale]}
        >
            <group ref={groupRef}>
                {children}
            </group>
        </group>
    );
}

export default ManipulationSpace;
