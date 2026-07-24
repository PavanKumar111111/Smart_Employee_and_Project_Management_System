import { BackendDownError } from "../types/api.types";
import axios from "axios";

export function parseError(error) {
  // 1. Backend is unreachable (ERR_NETWORK, ERR_CONNECTION_REFUSED)
  if (error instanceof BackendDownError) {
    return "Cannot connect to the server.";
  }
  // 2. Axios HTTP error with backend JSON body
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    if (status === 401)
      return message || "Your session has expired. Please log in again.";
    if (status === 403)
      return "You do not have permission to perform this action.";
    if (status === 404)
      return message || "The requested resource was not found.";
    if (status === 409)
      return message || "A conflict occurred. Please try again.";
    if (status === 400)
      return message || "Invalid request. Please check your input.";
    if (status && status >= 500)
      return "A server error occurred. Please try again later.";
    if (!error.response) return "Cannot connect to the server.";
    return message || "An unexpected error occurred.";
  }
  // 3. Unknown error
  console.error("Unhandled error:", error);
  return "Something went wrong. Please try again.";
}

export function isBackendDown(error) {
  return error instanceof BackendDownError;
}
