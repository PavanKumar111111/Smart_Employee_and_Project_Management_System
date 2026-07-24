import { format } from "date-fns";

export function formatDate(dateString) {
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  try {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  } catch {
    return dateString;
  }
}
