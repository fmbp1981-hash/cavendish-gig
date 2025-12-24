export function b64EncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function b64DecodeToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function importAesGcmKeyFromEnv(envVarName: string): Promise<CryptoKey> {
  const keyB64 = Deno.env.get(envVarName);
  if (!keyB64) {
    throw new Error(`${envVarName} not configured (base64 32 bytes)`);
  }

  const keyBytes = b64DecodeToBytes(keyB64);
  if (keyBytes.length !== 32) {
    throw new Error(`${envVarName} must be 32 bytes (got ${keyBytes.length})`);
  }

  return await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptJsonAesGcm(key: CryptoKey, data: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const payload = {
    v: 1,
    iv: b64EncodeBytes(iv),
    ct: b64EncodeBytes(new Uint8Array(ciphertext)),
  };
  return btoa(JSON.stringify(payload));
}

export async function decryptJsonAesGcm<T = unknown>(key: CryptoKey, encrypted: string): Promise<T> {
  const decoded = JSON.parse(atob(encrypted));
  const iv = b64DecodeToBytes(decoded.iv);
  const ct = b64DecodeToBytes(decoded.ct);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  const json = new TextDecoder().decode(new Uint8Array(plaintext));
  return JSON.parse(json) as T;
}
