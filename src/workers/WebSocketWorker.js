// Enum-like object for encodings
const Encoding = {
    // [X: f32, Y: f32, Z: f32] * N + [R: u8, G: u8, B: u8, A: u8] * N
    XYZ_RGBA_f32: 'XYZ_RGBA_f32',
    XYZ_RGBA_f32_NaN: 'XYZ_RGBA_f32_NaN',

    // [X: i16, Y: i16, Z: i16] * N + [R: u8, G: u8, B: u8, A: u8] * N
    XYZ_RGBA_i16: 'XYZ_RGBA_i16',
    XYZ_RGBA_i16_NaN: 'XYZ_RGBA_i16_NaN',

    // [X: i16, Y: i16, Z: i16] * N + [RGB: i16] * N
    XYZ_RGB16_i16: 'XYZ_RGB16_i16',

    // [X: i16, Y: i16, Z: i16] * N + [RGB: u8, RGB': u8] * N+1//2
    XYZ_RGB8_i16: 'XYZ_RGB8_i16',
    // Add more encodings here
    default: 'XYZ_RGBA_f32_NaN',
};

const webSocketWorker = () => {

    // Enum-like object for encodings
    const Encoding = {
        // [X: f32, Y: f32, Z: f32] * N + [R: u8, G: u8, B: u8, A: u8] * N
        XYZ_RGBA_f32: 'XYZ_RGBA_f32',
        XYZ_RGBA_f32_NaN: 'XYZ_RGBA_f32_NaN',

        // [X: i16, Y: i16, Z: i16] * N + [R: u8, G: u8, B: u8, A: u8] * N
        XYZ_RGBA_i16: 'XYZ_RGBA_i16',
        XYZ_RGBA_i16_NaN: 'XYZ_RGBA_i16_NaN',

        // [X: i16, Y: i16, Z: i16] * N + [RGB: i16] * N
        XYZ_RGB16_i16: 'XYZ_RGB16_i16',

        // [X: i16, Y: i16, Z: i16] * N + [RGB: u8, RGB': u8] * N+1//2
        XYZ_RGB8_i16: 'XYZ_RGB8_i16',
        // Add more encodings here
        default: 'XYZ_RGBA_f32_NaN',
    };

    let socket = null;
    let _encoding = Encoding.default;

    onmessage = async (event) => {
        const { type, url, data, encoding } = event.data;

        if (type === 'init') {
            _encoding = encoding;

            if (socket) {
                socket.close();
            }

            socket = new WebSocket(url);
            socket.binaryType = "arraybuffer";

            socket.onopen = () => {
                postMessage({ type: 'connectionState', payload: 'Open' });
                console.log('Streaming WebSocket connected.');
            };

            socket.onclose = () => {
                postMessage({ type: 'connectionState', payload: 'Closed' });
                console.log('Streaming WebSocket connection closed.');
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            socket.onmessage = async (msgEvent) => {
                // PERFORMANCE TEST
                // console.log('message_received,', performance.now());
                
                const arrayBuffer = msgEvent.data instanceof Blob
                    ? await msgEvent.data.arrayBuffer()
                    : msgEvent.data;

                // PERFORMANCE TEST
                // console.log('start_decoding,', performance.now());

                decodeMessage(arrayBuffer);
                
                // PERFORMANCE TEST
                // console.log('end_decoding,', performance.now());
            };
        }

        if (type === 'send') {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(data);
            }
        }

        if (type === 'close') {
            if (socket) {
                socket.close();
            }
        }
    };

    /**
     * Decodes a buffer with encoding XYZ_RGBA_f32.
     * Message contains [x float32, y float32, z float32]*N + [RGBA float32]*N
     * Where N is the number of points.
     *
     * @param {ArrayBuffer} buffer - The buffer to decode.
     * @param {Number} numPoints - The number of points in the buffer.
     * @returns {Object} An object with positions and colors in Float32Array format.
     */
    const from_XYZ_RGBA_f32 = (buffer, numPoints) => {

        // Create a Float32Array view of the buffer for positions
        const positions = new Float32Array(buffer, 0, numPoints * 3);

        // Create a Uint8Array view of the buffer for colors
        const colors = new Uint8Array(buffer, numPoints * 12, numPoints * 4);

        return { positions, colors };
    }

    /**
     * Decodes a buffer with encoding XYZ_RGBA_i16.
     * Message contains [x int16, y int16, z int16]*N + [RGBA uint8]*N
     * Where N is the number of points.
     *
     * @param buffer
     * @param numPoints
     * @returns {{positions: Int16Array, colors: Uint8Array}}
     */
    const from_XYZ_RGBA_i16 = (buffer, numPoints, multiplier = 10) => {

        // Create a Int16Array view of the buffer for positions
        const positions = new Int16Array(buffer, 0, numPoints * 3);

        // Create a Uint8Array view of the buffer for colors
        const colors = new Uint8Array(buffer, numPoints * 6, numPoints * 4);

        return { positions, colors };
    }

    const from_XYZ_RGB16_i16 = (buffer, numPoints, multiplier = 10) => {
        const positions = new Int16Array(buffer, 0, numPoints * 3);
        const colors16 = new Int16Array(buffer, numPoints * 6, numPoints);
        const colors = new Uint8Array(numPoints * 4);

        for (let i = 0; i < numPoints; i++) {
            const c_rgb = colors16[i];
            colors[i * 4] = ((c_rgb >> 10) & 0b111111) / 63 * 255;
            colors[i * 4 + 1] = ((c_rgb >> 4) & 0b111111) / 63 * 255;
            colors[i * 4 + 2] = (c_rgb & 0b1111) / 15 * 255;
            colors[i * 4 + 3] = 255;
        }

        // console.log('positions', positions);
        // console.log('colors', colors);


        return { positions, colors };
    }

    const from_XYZ_RGB8_i16 = (buffer, numPoints, multiplier = 10) => {

            // Create a Int16Array view of the buffer for positions
            const positions = new Int16Array(buffer, 0, numPoints * 3);

            // Create a Uint8Array view of the buffer for colors in a loop
            const colors8 = new Uint8Array(buffer, numPoints * 6, numPoints);
            const colors = new Uint8Array(numPoints * 4);

            for (let i = 0; i < numPoints; i++) {
                // Decode this packing
                // rgb332 = (((c_rgb >> 5) & 0b111) << 5) | (((c_rgb >> 5) & 0b111) << 2) | ((c_rgb >> 6) & 0b11)

                // Decode the 8-bit RGB value
                const c_rgb = colors8[i];
                colors[i * 4] = (((c_rgb >> 5) & 0b111) << 5);
                colors[i * 4 + 1] = (((c_rgb >> 2) & 0b111) << 5);
                colors[i * 4 + 2] = ((c_rgb & 0b11) << 6)/3*255;
                colors[i * 4 + 3] = 255;
            }


            return { positions, colors };
    }

    const Decoders = {
        [Encoding.XYZ_RGBA_f32]: from_XYZ_RGBA_f32,
        [Encoding.XYZ_RGBA_f32_NaN]: from_XYZ_RGBA_f32,
        [Encoding.XYZ_RGBA_i16]: from_XYZ_RGBA_i16,
        [Encoding.XYZ_RGBA_i16_NaN]: from_XYZ_RGBA_i16,
        [Encoding.XYZ_RGB16_i16]: from_XYZ_RGB16_i16,
        [Encoding.XYZ_RGB8_i16]: from_XYZ_RGB8_i16,
        // Add more decoders here
    };

    const decodeMessage = (buffer) => {
        // Example decoding logic for positions and colors
        // Replace with more sophisticated decoding if needed

        // Get the decoder function
        const decoder = Decoders[_encoding];

        // Get the number of points
        let numPoints = 0;

        switch (_encoding) {
            case Encoding.XYZ_RGBA_f32:
            case Encoding.XYZ_RGBA_f32_NaN:
                // 4 * 4 (f32) = 16
                numPoints = buffer.byteLength / 16;
                break;
            case Encoding.XYZ_RGBA_i16:
            case Encoding.XYZ_RGBA_i16_NaN:
                // 3 * 2 (i16) + 1 * 4 (f32) = 10
                numPoints = buffer.byteLength / 10;
                break;
            case Encoding.XYZ_RGB16_i16:
                // 3 * 2 (i16) + 1 * 2 (i16) = 8
                numPoints = buffer.byteLength / 8;
                break;
            case Encoding.XYZ_RGB8_i16:
                // 3 * 2 (i16) + 1 * 1 (u8) = 7
                // numPoints = buffer.byteLength / 7 if buffer.byteLength % 7 == 0 else (buffer.byteLength - 1) / 7
                numPoints = buffer.byteLength % 7 === 0 ? buffer.byteLength / 7 : (buffer.byteLength - 1) / 7;
                break;
        }

        try {
            if (!decoder) {
                throw new Error(`Invalid decoder: ${_encoding}`);
            }

            const {positions, colors} = decoder(buffer, numPoints);

            postMessage({
                type: 'updatePoints',
                payload: {positions, colors}
            });
        } catch (error) {
            postMessage({ error: error.message });
        }
    };
};

let code = webSocketWorker.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));
const blob = new Blob([code], { type: 'application/javascript' });
const workerScript = URL.createObjectURL(blob);

export {Encoding, workerScript };
