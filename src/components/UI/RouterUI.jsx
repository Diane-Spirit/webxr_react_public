import {Root} from '@react-three/uikit';
import {Card} from '@react-three/uikit-apfel';
import {useEffect} from 'react';
import useScene from "../../hooks/SceneHook.jsx";

function RouterUI({routes = [], defaultRoute }) {
    // Get the current route and setRoute function from the context
    const { route, setRoute } = useScene()

    useEffect(() => {
        // Set the default route
        if (route) return

        if (defaultRoute) {
            setRoute(defaultRoute);
        } else if (routes.length > 0) {
            setRoute(routes[0].path);
        }
    }, []);

    // Get the current component for the route
    const currentComponent = routes.find(r => r.path === route)?.component || null;

    return (
        <Root flexDirection="row" pixelSize={0.0005}>
            <Card borderRadius={32} padding={32} gap={8} flexDirection="column">
                {/* Render the component for the current route */}
                {currentComponent}
            </Card>
        </Root>
    );
}

export default RouterUI;
