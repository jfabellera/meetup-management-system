/** Reveal and focus a form control by the element id its field renders with. */
export const focusField = (name: string): void => {
  const field = document.getElementById(name);
  if (field == null) return;
  field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  field.focus({ preventScroll: true });
};
