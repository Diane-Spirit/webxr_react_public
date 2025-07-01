import useScene from "../../hooks/SceneHook.jsx";
import {useEffect} from "react";

function RouterScene({ scenes = [], defaultScene }) {
    const {scene, setScene} = useScene();

    useEffect(() => {
        // Set the default route
        if (scene) return

        if (defaultScene) {
            setScene(defaultScene);
        } else if (scenes.length > 0) {
            setScene(scenes[0].path);
        }
    }, []);

    // Get the current component for the route
    const currentComponent = scenes.find(r => r.path === scene)?.component || null;

    return (
        <>
            {/* Render the component for the current route */}
            {currentComponent}
        </>
    );
}

export default RouterScene;
