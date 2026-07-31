const TAG = "DocumentSecurity";

const MASK_PATTERNS: { pattern: RegExp; replacement: (match: string) => string }[] = [
  // Account numbers: 9-18 digits, optionally with hyphens/spaces
  { pattern: /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4,8})\b/g, replacement: (m) => maskMiddle(m) },
  // PAN: ABCDE1234F
  { pattern: /\b([A-Z]{5}\d{4}[A-Z])\b/g, replacement: (m) => `${m.slice(0, 2)}****${m.slice(-1)}` },
  // Aadhaar: 12 digits with optional spaces
  { pattern: /\b(\d{4}\s?\d{4}\s?\d{4})\b/g, replacement: (m) => `**** **** ${m.replace(/\s/g, "").slice(-4)}` },
  // IFSC: ABCD0123456
  { pattern: /\b([A-Z]{4}0[A-Z0-9]{6})\b/g, replacement: (m) => `${m.slice(0, 4)}****` },
  // Card numbers: 4 groups of 4 digits
  { pattern: /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g, replacement: (m) => `**** **** **** ${m.replace(/[\s-]/g, "").slice(-4)}` },
  // CVV: 3 digits after specific keywords
  { pattern: /(?:CVV|CVC|cvv|cvc)[:\s]*(\d{3})/g, replacement: (m) => m.replace(/\d{3}$/, "***") },
  // Passwords
  { pattern: /(?:password|passwd|pwd)[:\s]*[^\s,;]+/gi, replacement: (m) => m.split(/[:=]/)[0] + ": ********" },
];

function maskMiddle(value: string): string {
  const stripped = value.replace(/[\s-]/g, "");
  if (stripped.length <= 4) return "****";
  const showStart = Math.min(2, Math.floor(stripped.length * 0.15));
  const showEnd = Math.min(4, Math.floor(stripped.length * 0.25));
  const start = stripped.slice(0, showStart);
  const end = stripped.slice(-showEnd);
  const maskedLen = stripped.length - showStart - showEnd;
  return `${start}${"*".repeat(Math.min(maskedLen, 8))}${end}`;
}

export const documentSecurityService = {
  maskText(text: string): string {
    let masked = text;
    for (const { pattern, replacement } of MASK_PATTERNS) {
      masked = masked.replace(pattern, replacement);
    }
    return masked;
  },

  maskExtraction<T extends Record<string, unknown>>(data: T, sensitiveKeys: string[]): Partial<T> {
    const result = { ...data };
    for (const key of sensitiveKeys) {
      if (typeof result[key] === "string") {
        (result as Record<string, unknown>)[key] = this.maskText(result[key] as string);
      }
    }
    return result;
  },

  maskAccountNumber(accountNumber: string): string {
    return maskMiddle(accountNumber);
  },

  maskPAN(pan: string): string {
    if (pan.length < 5) return "****";
    return `${pan.slice(0, 2)}****${pan.slice(-1)}`;
  },

  maskAadhaar(aadhaar: string): string {
    const stripped = aadhaar.replace(/\s/g, "");
    return `**** **** ${stripped.slice(-4)}`;
  },

  getSensitiveFields(): string[] {
    return [
      "accountNumber",
      "accountNumberMasked",
      "pan",
      "aadhaar",
      "ifsc",
      "cardNumber",
      "cvv",
      "password",
      "employeeId",
    ];
  },

  securePreview(data: Record<string, unknown>): Record<string, unknown> {
    const result = { ...data };
    const sensitive = this.getSensitiveFields();
    for (const key of sensitive) {
      if (result[key]) {
        result[key] = this.maskText(String(result[key]));
      }
    }
    return result;
  },
};
