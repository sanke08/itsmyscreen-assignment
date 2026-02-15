export async function getFingerprint() {
  if (typeof window === "undefined") return "";

  const userAgent = window.navigator.userAgent;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const screenSize = `${window.screen.width}x${window.screen.height}`;
  
  const data = `${userAgent}|${timezone}|${screenSize}`;
  
  // Hash the data to create a consistent fingerprint
  const encoder = new TextEncoder();
  const dataUint8 = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", dataUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
}
