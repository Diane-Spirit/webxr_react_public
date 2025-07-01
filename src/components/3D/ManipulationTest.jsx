import {useRef, useState} from "react";
import {useFrame} from "@react-three/fiber";
import DianeLogo from "./DianeLogo.jsx";
import {
    useGetXRSpaceMatrix,
    useXRInputSourceEvent,
    useXRInputSourceState,
    useXRInputSourceStates,
    useXRSpace
} from "@react-three/xr";
import {Matrix4, Quaternion, Vector3} from "three";


function ManipulationTest({initialPosition, initialScale}) {
    const logoRef = useRef(null);

    const [leftGrip, setLeftGrip] = useState(false);
    const [rightGrip, setRightGrip] = useState(false);

    // Input source space for left input source
    const leftControllerState = useXRInputSourceState('controller', 'left');
    const leftHandState = useXRInputSourceState('hand', 'left');
    const leftInputSource = leftControllerState?.inputSource ?? leftHandState?.inputSource;

    const getLeftSpaceMatrix = useGetXRSpaceMatrix(leftInputSource?.targetRaySpace);

    // Input source space for right input source
    const rightControllerState = useXRInputSourceState('controller', 'right');
    const rightHandState = useXRInputSourceState('hand', 'right');
    const rightInputSource = rightControllerState?.inputSource ?? rightHandState?.inputSource;

    const getRightSpaceMatrix = useGetXRSpaceMatrix(rightInputSource?.targetRaySpace);

    // Is grabbing
    const [grabbing, setGrabbing] = useState(false);

    // CHANGE CONTROL MODE?


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

    // Controller events
    useXRInputSourceEvent('all', 'squeezestart', handleEvent, []);
    useXRInputSourceEvent('all', 'squeezeend', handleEvent, []);

    // Hand events
    useXRInputSourceEvent('all', 'selectstart', handleEvent, []);
    useXRInputSourceEvent('all', 'selectend', handleEvent, []);

    // Pre-initialize transformation matrices for better performances
    const leftSpaceMatrix = new Matrix4();
    const rightSpaceMatrix = new Matrix4();
    const leftPosition = new Vector3();
    const rightPosition = new Vector3();

    const initialLeftSpaceMatrix = new Matrix4();
    const initialRightSpaceMatrix = new Matrix4();
    const initialLeftPosition = new Vector3();
    const initialRightPosition = new Vector3();


    useFrame(({gl}) => {
        // Read the input and calculate grabbing etc
        if (leftGrip && rightGrip) {

            // Get current XRFrame
            const frame = gl.xr.getFrame();

            if(!grabbing) {
                setGrabbing(true);

                // Save initial matrices
                getLeftSpaceMatrix(initialLeftSpaceMatrix, frame);
                getRightSpaceMatrix(initialRightSpaceMatrix, frame);

                initialLeftSpaceMatrix.decompose(initialLeftPosition, new Quaternion(), new Vector3());
                initialRightSpaceMatrix.decompose(initialRightPosition, new Quaternion(), new Vector3());
            }

            // Get the spaces for the left and right input sources
            getLeftSpaceMatrix(leftSpaceMatrix, frame);
            getRightSpaceMatrix(rightSpaceMatrix, frame);

            leftSpaceMatrix.decompose(leftPosition, new Quaternion(), new Vector3());
            rightSpaceMatrix.decompose(rightPosition, new Quaternion(), new Vector3());

            // TODO: FROM HERE

            // Calculate the distance between the two spaces
            const distance = leftPosition.distanceTo(rightPosition);

            console.log(leftSpaceMatrix, rightSpaceMatrix, distance);

            // Calculate the midpoint between the two spaces
            const midpoint = new Vector3().addVectors(leftPosition, rightPosition).multiplyScalar(0.5);

            // Set the position and scale of the logo
            logoRef.current.position.copy(midpoint);
            logoRef.current.scale.set(distance, distance, distance);
        }
    });

    return (
        <DianeLogo ref={logoRef} position={initialPosition} scale={initialScale} />
    );
}

export default ManipulationTest;
