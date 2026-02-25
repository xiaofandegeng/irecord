export async function encryptData(text: string, password: string): Promise<string> {
    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    )

    const salt = crypto.getRandomValues(new Uint8Array(16))
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    )

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(text)
    )

    const encryptedBuffer = new Uint8Array(encrypted)

    // Pack salt, iv, and encrypted text together
    const packed = new Uint8Array(salt.length + iv.length + encryptedBuffer.length)
    packed.set(salt, 0)
    packed.set(iv, salt.length)
    packed.set(encryptedBuffer, salt.length + iv.length)

    // Encode as Base64 format
    let binary = ''
    for (let i = 0; i < packed.byteLength; i++) {
        binary += String.fromCharCode(packed[i])
    }
    return btoa(binary)
}

export async function decryptData(encryptedBase64: string, password: string): Promise<string> {
    let packed: Uint8Array
    try {
        const binStr = atob(encryptedBase64)
        packed = new Uint8Array(binStr.length)
        for (let i = 0; i < binStr.length; i++) {
            packed[i] = binStr.charCodeAt(i)
        }
    } catch (e) {
        throw new Error('数据损坏或不是有效的加密格式')
    }

    const saltLength = 16
    const ivLength = 12

    if (packed.length < saltLength + ivLength) {
        throw new Error('加密数据长度异常')
    }

    const salt = packed.slice(0, saltLength)
    const iv = packed.slice(saltLength, saltLength + ivLength)
    const encryptedBuffer = packed.slice(saltLength + ivLength)

    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    )

    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    )

    const dec = new TextDecoder()
    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encryptedBuffer
        )
        return dec.decode(decrypted)
    } catch (e) {
        throw new Error('解密失败，密钥错误或数据被篡改')
    }
}
