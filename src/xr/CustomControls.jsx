import {
    defaultTouchPointerOpacity,
    PointerCursorModel,
    PointerRayModel,
    usePointerXRInputSourceEvents,
    useRayPointer, useTouchPointer,
    useXRInputSourceStateContext, XRControllerModel, XRHandModel,
    XRSpace
} from "@react-three/xr";
import {Suspense, useRef} from "react";
import {Vector3} from "three";

export default function createCustomControls(handedness = 'right') {

    function CustomController() {
        const state = useXRInputSourceStateContext('controller')
        const controllerRef = useRef(null)
        const pointer = useRayPointer(controllerRef, state, {
            direction: new Vector3(0, 0, -1),
            minDistance: 0,
        })

        usePointerXRInputSourceEvents(pointer, state.inputSource, "select", [])

        return (
            <>
                { state.inputSource.handedness === handedness &&
                    <>
                        <XRSpace ref={controllerRef} space={state.inputSource.targetRaySpace} >
                            <PointerRayModel pointer={pointer} />
                        </XRSpace>
                        <PointerCursorModel pointer={pointer} size={0.05} opacity={defaultTouchPointerOpacity} />
                    </>
                }
                <Suspense>
                    <XRControllerModel />
                </Suspense>
            </>
        )
    }

    function CustomHand() {
        const state = useXRInputSourceStateContext('hand')
        const indexFingerRef = useRef(null)
        const pointer = useTouchPointer(indexFingerRef, state, {
            hoverRadius: 0.05,
            downRadius: 0.025,
            clickThesholdMs: 750
        })

        return (
            <>
                { state.inputSource.handedness === handedness &&
                    <>
                        <XRSpace ref={indexFingerRef} space={state.inputSource.hand.get('index-finger-tip')} />
                        { /* <PointerCursorModel pointer={pointer} size={0.05} opacitiy={defaultTouchPointerOpacity} /> */ }
                    </>
                }
                <Suspense>
                    <XRHandModel />
                </Suspense>
            </>
        )
    }

    return {CustomController, CustomHand};
}
