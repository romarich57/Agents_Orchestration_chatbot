import { format, formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";

export const formatAbsoluteDate = (date: string | Date) =>
  format(new Date(date), "dd MMM yyyy", {
    locale: fr,
  });

export const formatRelativeDate = (date: string | Date) =>
  formatDistanceToNowStrict(new Date(date), {
    addSuffix: true,
    locale: fr,
  });
