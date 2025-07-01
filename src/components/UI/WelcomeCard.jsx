import {Text} from "@react-three/uikit";
import {Button} from "@react-three/uikit-apfel";
import useScene from "../../hooks/SceneHook.jsx";

function WelcomeCard() {

    const { setRoute, setScene } = useScene();

    return (
        <>
            { /* Welcome message */ }
            <Text fontSize={32} fontWeight={500}>Diane Project</Text>
            <Text fontSize={24} opacity={0.7}>
                Welcome to the future!
            </Text>

            { /* Start button */ }
            <Button variant="rect" size="xl" platter active={{opacity: 0.5}} onClick={() => {
                setRoute("robot-selection");
            }} hover={{backgroundColor: "blue"}}>
                <Text fontWeight={"bold"}>Start</Text>
            </Button>

            { /* Other Buttons
            <Button variant="rect" size="xl" platter active={{opacity: 0.5}} onClick={() => {
                setScene("manipulation-test");
            }} hover={{backgroundColor: "blue"}}>
                <Text fontWeight={"bold"}>Manipulation</Text>
            </Button>

            <Button variant="rect" size="xl" platter active={{opacity: 0.5}} onClick={() => {
                setScene("performance-test");
            }} hover={{backgroundColor: "blue"}}>
                <Text fontWeight={"bold"}>Performance</Text>
            </Button>
            */ }
        </>
    );
}

export default WelcomeCard;