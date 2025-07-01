import {
    useXRInputSourceState,
    XRSpace
} from "@react-three/xr";
import {createContext, useEffect, useRef, useState} from 'react';
import {Box3, DoubleSide, Matrix4, Vector3} from 'three';
import {useFrame, useThree} from "@react-three/fiber";
import {abs} from "three/src/nodes/math/MathNode.js";
import {ControllerJoystick} from "./ControllerJoystick.jsx"; // Import necessary THREE utilities

// Create a Context
export const ControllerSpaceContext = createContext({
    updateOffset: () => {
    }
});

export function ControllerSpace({
                                    children,
                                    handedness = 'right',
                                    translationOffset = {x: 0, y: 0, z: 0},
                                    rotationOffset = {x: 0, y: 0, z: 0}
                                }) {

    const controllerState = useXRInputSourceState('controller', handedness);
    const handState = useXRInputSourceState('hand', handedness);
    const inputSource = controllerState?.inputSource ?? handState?.inputSource;

    const groupRef = useRef();
    const contentRef = useRef();
    const [boundingBoxReady, setBoundingBoxReady] = useState(false);
    const [visible, setVisible] = useState(false);

    const [grabbing, setGrabbing] = useState({left: false, right: false});

    const {gl} = useThree();


    const [debugString, setDebugString] = useState("");


    const controllerOffset = {
        position: {x: -0.02, y: 0, z: 0},
        rotation: {x: -Math.PI / 4, y: 0, z: 0}
    }

    const handOffset = {
        position: {x: 0.02, y: 0, z: -0.0475},
        rotation: {x: Math.PI / 4 - .4, y: -.4, z: Math.PI - 1.1}
    }

    const updateOffset = function () {
        if (!groupRef.current || !contentRef.current || !contentRef.current.children[0]) return;

        console.log('Computing offset');

        // Reset the group's position and rotation
        groupRef.current.rotation.set(0, 0, 0);
        groupRef.current.position.set(0, 0, 0);
        contentRef.current.position.set(0, 0, 0);
        contentRef.current.rotation.set(0, 0, 0);

        // Apply the inverse of the parent's world matrix to the clone
        const parentMatrix = new Matrix4().copy(groupRef.current.parent.matrixWorld)
        groupRef.current.applyMatrix4(parentMatrix.invert());

        // Compute the bounding box on the clone with no transformations from parent
        const boundingBox = new Box3().setFromObject(contentRef.current, true);
        groupRef.current.applyMatrix4(parentMatrix.invert());

        const size = new Vector3();
        boundingBox.getSize(size);

        // Check if bounding box is valid
        if (!isNaN(size.x) && !isNaN(size.y) && !isNaN(size.z)) {
            // console.log(size);

            // Apply translation to the content group based on bounding box dimensions
            contentRef.current.position.set(
                (size.x / 2 + translationOffset.x - (controllerState?.inputSource ? controllerOffset.position.x : handOffset.position.x)) * (handedness === 'right' ? -1 : 1), // Center position on the X axis
                (size.y / 2 + translationOffset.y + (controllerState?.inputSource ? controllerOffset.position.y : handOffset.position.y)), // Center position on the Y axis
                (size.z / 2 + translationOffset.z + (controllerState?.inputSource ? controllerOffset.position.z : handOffset.position.z))  // Center position on the Z axis
            );

            // Apply rotation offset
            groupRef.current.rotation.set(
                rotationOffset.x + (controllerState?.inputSource ? controllerOffset.rotation.x : handOffset.rotation.x),
                rotationOffset.y + (controllerState?.inputSource ? controllerOffset.rotation.y : handOffset.rotation.y * (handedness === 'right' ? 1 : -1)),
                rotationOffset.z + (controllerState?.inputSource ? controllerOffset.rotation.z : handOffset.rotation.z * (handedness === 'right' ? 1 : -1))
            );

            // Make all materials but texts double-sided
            groupRef.current.traverse((child) => {
                if (child.material && child.material.type === 'MeshPhongMaterial') {
                    child.material.side = DoubleSide;
                }
            });

            // Make the group visible
            setVisible(true);
            setBoundingBoxReady(true);  // Mark bounding box as ready

            // console.log(groupRef);
        } else {
            console.error("Invalid bounding box");
        }
    };

    // Reset bounding box when children or inputSource change
    useEffect(() => {
        setVisible(false);
        setTimeout(() => {
            updateOffset();
        }, 200);
    }, [inputSource]);

    // States for fading animations
    const [runningHiddenFunction, setRunningHiddenFunction] = useState(-1);

    // Fade out objects when rotating
    const fadeOutWhenRotating = (lowerBound, upperBound) => {
        if (runningHiddenFunction === 0){
            // contentRef?.current.children[0].children.forEach((child) => {
            //     if (child.material) {
            //         // color material red
            //         child.material.color.set(0x0000ff);
            //     }
            // });
        }else if (runningHiddenFunction === -1){
            // contentRef?.current.children[0].children.forEach((child) => {
            //     if (child.material) {
            //         // color material red
            //         child.material.color.set(0xffff00);
            //     }
            // });
        }
        if (inputSource?.targetRaySpace) {
            let frame = gl.xr.getFrame()
            let rotationZ = frame.getPose(inputSource.targetRaySpace, gl.xr.getReferenceSpace())?.transform.orientation.z
            
            if(!rotationZ) return;


            if (Math.abs(rotationZ) >= lowerBound) {
                if (runningHiddenFunction === -1 || runningHiddenFunction === 0) {
                    setRunningHiddenFunction(0);
                    contentRef.current.children[0].children.forEach((child) => {
                        if (child.material) {
                            child.material.transparent = true;
                            child.material.opacity = (handState ? 0 : 1) - (handState ? - 1 : 1) * Math.min((Math.abs(rotationZ) - lowerBound) * (1 / Math.abs(upperBound - lowerBound)), 1)
                        }
                    });
                }
            } else if (runningHiddenFunction === 0) {
                setRunningHiddenFunction(-1)
            }
        }
    }

    // Variables of Hide and Show UI
    const [lastInstruction, setLastInstruction] = useState(1); // 1 for show, 0 for hide
    const [startingTimestamp, setStartingTimestamp] = useState(new Date().getTime());
    const time_ms = 500;
    const [lastSampleProgress, setLastSampleProgress] = useState(1); // opacity progress
    let startingTs = 0;

    const hideUI = () => {
        if (runningHiddenFunction !== -1 && runningHiddenFunction !== 1) return;
        setRunningHiddenFunction(1);
        // contentRef?.current.children[0].children.forEach((child) => {
        //     if (child.material) {
        //         // color material red
        //         child.material.color.set(0xff0000);
        //     }
        // });
        if (lastSampleProgress === 0) return;

        if (lastInstruction === 1) {
            startingTs = new Date().getTime() - (1 - lastSampleProgress) * time_ms;
            setStartingTimestamp(startingTs);
        }
        let progress = Math.min((new Date().getTime() - Math.max(startingTs, startingTimestamp)) / time_ms, 1);

        contentRef.current?.children[0].children.forEach((child) => {
            if (child.material) {
                child.material.transparent = true;
                child.material.opacity = child.material.opacity - (progress - (1 - lastSampleProgress));
            }
        });

        setLastSampleProgress(1 - progress);
        setLastInstruction(0)
    }

    const showUI = () => {
        if (runningHiddenFunction !== 1) return;
        // contentRef?.current.children[0].children.forEach((child) => {
        //     if (child.material) {
        //         // color material red
        //         child.material.color.set(0x00ff00);
        //     }
        // });
        if (lastSampleProgress === 1) {
            setRunningHiddenFunction(-1);
            return;
        }
        ;

        if (lastInstruction === 0) {
            startingTs = new Date().getTime() - lastSampleProgress * time_ms;
            setStartingTimestamp(startingTs);
        }
        let progress = Math.min((new Date().getTime() - Math.max(startingTs, startingTimestamp)) / time_ms, 1);

        contentRef.current?.children[0].children.forEach((child) => {
            if (child.material) {
                child.material.transparent = true;
                child.material.opacity = child.material.opacity + (progress - lastSampleProgress);
            }
        });
        setLastSampleProgress(progress);
        setLastInstruction(1);
    }

    useEffect(() => {
        window.addEventListener('grab', (event) => {
            setGrabbing(event.detail);
        });
    }, []);


    useFrame(
        () => {
            fadeOutWhenRotating(.25, .5);

            if (grabbing.left && grabbing.right) {
                hideUI();
            } else {
                showUI();
            }
        }
    );


    return (
        <XRSpace space={inputSource?.targetRaySpace}>
            <group ref={groupRef} visible={visible}>
                <group ref={contentRef}>
                    <ControllerSpaceContext.Provider value={{updateOffset, contentRef, debugString, setDebugString}}>
                            {children}
                    </ControllerSpaceContext.Provider>
                </group>
            </group>
        </XRSpace>
    );
}
