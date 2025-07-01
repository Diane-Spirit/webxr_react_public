/* eslint-disable react/no-unknown-property */
import {
    Environment,
    MeshPortalMaterial,
    RoundedBox, Sky, Text,
} from "@react-three/drei";
import {useFrame, useThree} from "@react-three/fiber";
import {useEffect, useRef, useState} from "react";
import * as THREE from "three";

function Test() {
    const portalMaterial = useRef();
    const {camera, gl} = useThree();
    const [isInside, setIsInside] = useState(false);

    const boxPosition = new THREE.Vector3(0, 0, -0.5);
    const boxSize = new THREE.Vector3(1, 1, 0.1);

    const [num, setNum] = useState(0);

    useFrame(() => {
        const cameraPosition = new THREE.Vector3();
        camera.getWorldPosition(cameraPosition);

        const diff = cameraPosition.clone().sub(boxPosition);
        const isInsideX = Math.abs(diff.x) < boxSize.x / 2;
        const isInsideY = Math.abs(diff.y) < boxSize.y / 2;
        const isInsideZ = Math.abs(diff.z) < boxSize.z / 2;

        if (isInsideX && isInsideY && isInsideZ) {
            setIsInside(isInsideX && isInsideY && isInsideZ);
        }
    });

    useEffect(() => {
        if (isInside) {
            console.log(portalMaterial.current);
            console.log("The user has passed through the box.");
            portalMaterial.current.blend = 1;
        }
    }, [isInside]);

    useEffect(() => {
        console.log(portalMaterial);
    }, [portalMaterial]);

    useEffect(() => {
        console.log(camera.layers.length);
        setNum(
            Object.keys(
            portalMaterial.current
        )
            .filter((key) => key.startsWith(""))
            .toString());

        // gl.xr.getCamera().cameras[0].layers.enable(1);
        // gl.xr.getCamera().cameras[0].layers.set(1);
        // portalMaterial.current.layers.set(1);
    }, []);

    return (
        <>
            <Text fontSize={0.1} position={[0, 1.5, -1]} color={"red"}>
                {num || -1}
            </Text>
            <ambientLight intensity={0.5}/>
            <Environment preset="sunset"/>

            <group position={boxPosition}>
                <RoundedBox
                    onClick={() =>
                        portalMaterial.current.blend
                            ? (portalMaterial.current.blend = 0)
                            : (portalMaterial.current.blend = 1)
                    }
                    frustumCulled={false}
                    name={name}
                    args={boxSize}
                >

                    <MeshPortalMaterial ref={portalMaterial} /* blend={isInside} */>
                        <ambientLight intensity={1}/>
                        <Environment preset="sunset"/>
                        <mesh position={[0, 0, 0]}>
                            <boxGeometry args={[.5, .5, .5]}/>

                            <meshStandardMaterial color={"orange"} side={THREE.BackSide}/>
                        </mesh>
                        <mesh position={[0, 0, 0]}>
                            <sphereGeometry args={[.25, .25, .25]}/>

                            <meshStandardMaterial color={"red"}/>
                        </mesh>
                    </MeshPortalMaterial>
                </RoundedBox>
            </group>
        </>
    );
}

export default Test;
