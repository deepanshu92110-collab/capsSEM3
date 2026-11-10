export const MAX_PAGE = 10_000;
export const MAX_PAGE_SIZE = 100;

export const MAX_TEXT_LENGTHS = {
  title: 200,
  description: 10_000,
  responsibilities: 5_000,
  qualifications: 5_000,
  location: 200,
  compensation: 200,
  applicationUrl: 2_048,
  companyName: 200,
  officialEmail: 254,
  website: 2_048,
  address: 500,
  companyDescription: 5_000,
  contactInfo: 1_000,
};

export function parsePagination(query = {}) {
  const parseInteger = (value, fallback, field, maximum) => {
    if (value === undefined) return { value: fallback };
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value))
      return { error: `${field} must be a positive integer` };
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number > maximum)
      return { error: `${field} must be between 1 and ${maximum}` };
    return { value: number };
  };

  const page = parseInteger(query.page, 1, "page", MAX_PAGE);
  if (page.error) return page;
  const pageSize = parseInteger(query.pageSize, 20, "pageSize", MAX_PAGE_SIZE);
  if (pageSize.error) return pageSize;
  return { page: page.value, pageSize: pageSize.value };
}

// Accepts canonical ISO 8601/RFC 3339 timestamps with an explicit timezone.
export function parseIsoDate(value) {
  if (typeof value !== "string") return null;
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.(\d{1,9}))?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/,
  );
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (year < 1 || month < 1 || month > 12) return null;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month - 1]) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isFutureDate(date, now = new Date()) {
  return date instanceof Date && !Number.isNaN(date.getTime()) && date > now;
}

export function validateHttpUrl(value) {
  if (typeof value !== "string" || value.length > MAX_TEXT_LENGTHS.applicationUrl)
    return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function publicOpportunityStatus(status) {
  if (status === undefined || status === "OPEN") return { status: "OPEN" };
  return { error: "Public opportunity browsing only supports status=OPEN" };
}

const allowedTransitions = {
  DRAFT: ["OPEN", "ARCHIVED"],
  OPEN: ["CLOSED", "ARCHIVED"],
  CLOSED: ["OPEN", "ARCHIVED"],
  ARCHIVED: [],
};

export function isAllowedOpportunityTransition(current, next) {
  return allowedTransitions[current]?.includes(next) ?? false;
}
