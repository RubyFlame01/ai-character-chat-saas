// Shared between the server layout (reads) and the client AgeGate (writes).
// Lives outside any "use client" module so the server gets the real string,
// not a client-reference proxy.
export const AGE_GATE_COOKIE = "age_verified";
