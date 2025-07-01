import {Canvas} from '@react-three/fiber';
import {
    XR,
    createXRStore,
} from '@react-three/xr';  // Import XR-related components
import Scene from './components/Scene';
import {SceneContextProvider} from "./providers/SceneContext.jsx";

import './App.css'
import RemoteRobotsContextProvider from './providers/RemoteRobotsContext.jsx';
import LatencyTestContextProvider from './providers/LatencyTestContext.jsx';
import createCustomControls from "./xr/CustomControls.jsx";

const { CustomHand, CustomController } = createCustomControls('right');

const store = createXRStore({
    foveation: 0,
    meshDetection: false,
    planeDetection: false,
    hand: CustomHand,
    controller: CustomController,
});

const App = () => {

    return (
        <>
            {/* Add the VRButton to enable WebXR */}
            <button className={"enter-vr-button"} onClick={() => store.enterVR()}>Enter XR</button>

            {/* Wrap the Canvas in XR to enable VR features */}
            <Canvas camera={{position: [0, 1.6, 3]}} style={{background: "black"}}>
                <XR store={store}>
                    {/* Main 3D Scene */}
                    <SceneContextProvider>
                        <RemoteRobotsContextProvider signalingURL={"ws://167.99.85.145:3002"}>
                            <LatencyTestContextProvider>
                                <Scene />
                            </LatencyTestContextProvider>
                        </RemoteRobotsContextProvider>
                    </SceneContextProvider>
                </XR>
            </Canvas>
        </>
    );
};

export default App;