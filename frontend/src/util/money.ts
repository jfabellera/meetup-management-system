/** Formats integer minor units (cents) as a localized currency string. */
export const formatMoney = (cents: number, currency: string): string =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
