function to64(num) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let target = Math.floor(Math.abs(num));

    // Convert to Base64 Radix
    while (target > 0) {
        result = result + chars[target % 64];
        target = Math.floor(target / 64);
    }

    // Fallback for zero and enforce exactly 3 characters by padding left with 'A'
    result = (result || 'A').padEnd(3, 'A');

    // If the number is too large and exceeds 3 characters, truncate it from the left
    return result.slice(-3); 
}

function to16(num) {
    const chars = '0123456789ABCDEF';
    let result = '';
    let target = Math.floor(Math.abs(num));

    // Convert to Base64 Radix
    while (target > 0) {
        result = chars[target % 16] + result;
        target = Math.floor(target / 16);
    }

    // Fallback for zero and enforce exactly 3 characters by padding left with 'A'
    result = (result || '0').padStart(2, '0');

    // If the number is too large and exceeds 3 characters, truncate it from the left
    return result.slice(-2); 
}

function cleanNumber(input) {
  if (typeof input === 'string' && input.length > 0) {
    return input.charCodeAt(0);
  }
  return +input; 
}

function convertToMassMemory(data) {
    // Base 16
    let output = []
    for (let byte of data) {
        byte = cleanNumber(byte)
        output.push(to16(byte))
    }
    return output.join("").padEnd(8192, "0")
}

function convertToDualMemory(data) {
    // Base 16
    let output = []
    for (let byte of data) {
        byte = cleanNumber(byte)
        output.push(to16(byte))
    }
    return output.join("").padEnd(512, "0")
}

function convertToMassiveMemory(data) {
    // Base 64
    let output = []
    for (let byte of data) {
        byte = cleanNumber(byte)
        output.push(to64(byte))
    }
    return output.join("").padEnd(12288, 'A')
}

async function convertToHugeMemory(data) {
    // Base 64 + Deflate
    let output = [];

    for (let byte of data) {
        byte = cleanNumber(byte)
        if (byte > 65535) {
            output.push(65535);
        } else if (byte < 0) {
            output.push(0);
        } else {
            output.push(byte);
        }
    }

    if (output.length > 65536) {
        output.length = 65536;
    }

    while (output.length < 65536) {
        output.push(0);
    }

    const byteArray = new Uint8Array(131072);

    for (let i = 0; i < 65536; i++) {
        const value = output[i];
        byteArray[i * 2] = value & 0xFF;
        byteArray[i * 2 + 1] = (value >> 8) & 0xFF;
    }

    const cs = new CompressionStream("deflate-raw");
    const writer = cs.writable.getWriter();
    writer.write(byteArray);
    writer.close();

    const compressed = await new Response(cs.readable).arrayBuffer();
    const uint8 = new Uint8Array(compressed);

    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
    }

    let base64 = btoa(binary);

    if (base64.endsWith("==")) {
        base64 = base64.slice(0, -2);
    } else if (base64.endsWith("=")) {
        base64 = base64.slice(0, -1);
    }

    return base64;
}