import React, {forwardRef} from "react";
import {useGLTF, Text, Preload} from "@react-three/drei";
import {suspend} from "suspend-react";

const medium = import('/src/assets/fonts/ClashGrotesk-Medium.woff');
const bold = import('/src/assets/fonts/ClashGrotesk-Bold.woff');

const DianeLogo = forwardRef(({position = [0, 0, 0], rotation = [0, 0, 0], scale = 1}, ref) => {
    const Logo = useGLTF('models/DianeLogoScene.glb');

    // console.log(Logo);

    // Adjust material properties
    Logo.nodes.Wire.renderOrder = 1;
    Logo.nodes.Wire.material.toneMapped = false;

    Logo.nodes.Shape.material.toneMapped = false;

    Logo.nodes.Circle.renderOrder = -1;
    Logo.nodes.Circle.material.depthTest = false;
    Logo.nodes.Circle.material.toneMapped = false;

    Logo.nodes.Mask.renderOrder = -2;
    Logo.nodes.Mask.material.depthWrite = true;

    return (
        <group ref={ref} position={position} rotation={rotation} scale={[scale, scale, scale]}>
            <primitive object={Logo.scene} />
            <Text
                font={suspend(bold).default}
                fontSize={7}
                anchorY="top"
                anchorX="center"
                position={[0, -15, 0]}
                material-toneMapped={false}
            >
                DIANE
            </Text>
            <Text
                font={suspend(medium).default}
                fontSize={3}
                anchorY="top"
                anchorX="center"
                position={[-0.02, -22, 0]}
                letterSpacing={0.41}
                material-toneMapped={false}
            >
                PROJECT
            </Text>
            <Preload all />
        </group>
    );
});

DianeLogo.displayName = 'DianeLogo';

export default DianeLogo;
