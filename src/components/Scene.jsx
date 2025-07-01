import {MeshPortalMaterial, OrbitControls, Sky, Text} from '@react-three/drei';
import RouterUI from "./UI/RouterUI.jsx";
import {ControllerSpace} from "../xr/ControllerSpace.jsx";
import {useThree} from "@react-three/fiber";
import DianeLogo from "./3D/DianeLogo.jsx";
import PointCloud from "./3D/PointCloud.jsx";
import PerformanceTest from "../tests/PerformanceTest.jsx";
import useRemoteRobots from "../hooks/RemoteRobotsHook.jsx";
import WelcomeCard from "./UI/WelcomeCard.jsx";
import RobotSelectionMenu from "./UI/RobotSelectionMenu.jsx";
import RouterScene from "./3D/RouterScene.jsx";
import ManipulationSpace from "../xr/ManipulationSpace.jsx";
import Test from "./UI/Test.jsx";
import {ControllerJoystick} from "../xr/ControllerJoystick.jsx";

function Scene() {
    // Get the point cloud reference from the remote robot
    const { pointCloudRef } = useRemoteRobots();

    // Enable the OrbitControls
    const enableControls = true;

    // Get the camera from the three.js context
    const { camera } = useThree();

    // Set the camera position and field of view
    camera.fov = 35;
    camera.updateProjectionMatrix();

    return (
        <>
            {/* Ambient and directional lights */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[1, 1, 1]} />

            {/* OrbitControls allow the user to orbit around the scene */}
            <OrbitControls enabled={enableControls} target={[0, 1, -1.5]}  />

            {/* Menu anchored to the left controller */}
            <ControllerSpace handedness={'left'}>
                <ControllerJoystick />
                <RouterUI routes={
                    [
                        {path: 'welcome', component: <WelcomeCard />},
                        {path: 'robot-selection', component: <RobotSelectionMenu />}
                    ]
                } defaultRoute={'welcome'}/>
            </ControllerSpace>

            {/* Routing the scene view */}
            <RouterScene scenes={
                [
                    {path: 'welcome', component: <DianeLogo position={[0, 1.5, -3]} scale={0.05} />},
                    {path: 'point-cloud', component: <ManipulationSpace>
                            <PointCloud pointCloudRef={pointCloudRef}
                                        pointSize={5}
                                        fixedPointSize={true}
                                        position={[0, 0.8, 0]}
                                        rotation={[0, Math.PI, 0]}
                                        scale={0.002}/>
                        </ManipulationSpace>
                    },
                    {path: 'performance-test', component: <PerformanceTest/>},
                    {path: 'manipulation-test', component: <ManipulationSpace initialPosition={[0, 1, -3]}>
                            <mesh>
                                <boxGeometry/>
                                <meshStandardMaterial color={'orange'}/>
                            </mesh>
                		</ManipulationSpace>
                    },
                    {path: 'portal-test', component: <mesh name={0} position={[0,1,-1]}>
                            {/*<planeGeometry args={[1, 1, 1]}/>*/}
                            {/*<MeshPortalMaterial>*/}
                            {/*    <ambientLight intensity={0.5}/>*/}
                            {/*    <directionalLight position={[1, 1, 1]}/>*/}
                            {/*    <Sky/>*/}
                            {/*    <mesh position={[0, 0, 0]}>*/}
                            {/*        <boxGeometry args={[.2,.2,.2]}/>*/}
                            {/*        <meshStandardMaterial color={'orange'}/>*/}
                            {/*    </mesh>*/}
                            {/*</MeshPortalMaterial>*/}
                            <Test/>
                        </mesh>
                    }
                ]
            } defaultScene={'welcome'}/>

        </>
    );
}

export default Scene;