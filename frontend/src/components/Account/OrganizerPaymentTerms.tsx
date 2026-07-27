import { type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import terms from './organizerPaymentTerms.md?raw';

const components: Components = {
  h2: ({ children }) => (
    <h3 className="mt-3 text-base font-semibold first:mt-0">{children}</h3>
  ),
  blockquote: ({ children }) => (
    <div className="text-muted-foreground italic">{children}</div>
  ),
};

const OrganizerPaymentTerms = (): ReactNode => (
  <div className="flex flex-col gap-3 text-sm leading-relaxed">
    <ReactMarkdown components={components}>{terms}</ReactMarkdown>
  </div>
);

export default OrganizerPaymentTerms;
