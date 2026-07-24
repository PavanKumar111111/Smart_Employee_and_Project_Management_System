export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // If token is malformed, treat as expired
  }
}

export function getUserFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      employeeId: payload.sub || payload.employeeId,
      name: payload.name || "",
      email: payload.email || "",
      role: payload.role || undefined,
    };
  } catch {
    return null;
  }
}
