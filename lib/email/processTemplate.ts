// Email Template Variable Replacement
export interface TemplateVariables {
  customer_name: string;
  order_name: string;
  order_id: string;
  products: string;
  pdf_links: string;
  pdf_count: string;
}

export interface EmailTemplate {
  template: string;
  subject: string;
}

export const replaceTemplateVariables = (
  template: string,
  variables: TemplateVariables
): string => {
  let processedTemplate = template
    .replace(/{{customer_name}}/g, variables.customer_name)
    .replace(/{{order_name}}/g, variables.order_name)
    .replace(/{{order_id}}/g, variables.order_id)
    .replace(/{{products}}/g, variables.products)
    .replace(/{{pdf_links}}/g, variables.pdf_links)
    .replace(/{{pdf_count}}/g, variables.pdf_count);

  return processedTemplate;
};

export const processEmailTemplate = (
  emailTemplate: EmailTemplate,
  variables: TemplateVariables
): { processedTemplate: string; processedSubject: string } => {
  const processedTemplate = replaceTemplateVariables(emailTemplate.template, variables);
  const processedSubject = emailTemplate.subject.replace(/{{order_name}}/g, variables.order_name);

  return {
    processedTemplate,
    processedSubject
  };
};
