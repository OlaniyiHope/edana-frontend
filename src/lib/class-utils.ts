const LEGACY_CLASS_NAME_MAP: Record<string, string> = {
  js1: "JS1",
  js2: "JS2",
  js3: "JS3",
  jss1: "JS1",
  jss2: "JS2",
  jss3: "JS3",
  ss1: "SS1",
  ss2: "SS2",
  ss3: "SS3",
};

export function resolveClassName(value?: string | null) {
  const decoded = decodeURIComponent(String(value ?? "")).trim();
  if (!decoded) return "";

  return LEGACY_CLASS_NAME_MAP[decoded.toLowerCase()] ?? decoded;
}

export function toClassRouteParam(value?: string | null) {
  return encodeURIComponent(resolveClassName(value));
}
