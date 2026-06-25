const currencyLocales = {
  VND: "vi-VN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
} as const;

export type SupportedCurrency = keyof typeof currencyLocales;

export function formatMoney(amount: number, currency: string): string {
  const hasSupport = currency in currencyLocales;
  const locale = hasSupport
    ? currencyLocales[currency as SupportedCurrency]
    : "en-US";

  // Use standard formatter to handle currency-specific decimal rounding automatically
  const formattedAmount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: hasSupport ? currency : "USD", // fallback token for rounding logic
  })
    .formatToParts(amount)
    .filter((p) => p.type !== "currency" && p.type !== "literal")
    .map((p) => p.value)
    .join("")
    .trim();

  // Always force the exact format: "amount currency"
  return `${formattedAmount} ${currency}`;
}
