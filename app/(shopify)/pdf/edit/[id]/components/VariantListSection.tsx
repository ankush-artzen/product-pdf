import {
  BlockStack,
  Text,
  List,
  InlineStack,
  Badge,
} from "@shopify/polaris";

interface Variant {
  variantId: string;
  variantTitle: string;
  variantPrice?: string;
}

interface PDF {
  variantId?: string;
  name: string;
}

interface VariantListSectionProps {
  title: string;
  description: string;
  variants: Variant[];
  existingAttachments?: PDF[];
  badgeTone: "success" | "info" | "critical";
  badgeText: string;
  emptyMessage: string;
  showPdfName?: boolean;
}

export function VariantListSection({
  title,
  description,
  variants,
  existingAttachments,
  badgeTone,
  badgeText,
  emptyMessage,
  showPdfName = false,
}: VariantListSectionProps) {
  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodySm" fontWeight="bold">
        {title} ({variants.length})
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        {description}
      </Text>
      {variants.length > 0 ? (
        <List type="bullet">
          {variants.map((variant) => {
            const assignedPdf = existingAttachments?.find(
              (pdf) => pdf.variantId === variant.variantId
            );
            return (
              <List.Item key={variant.variantId}>
                <InlineStack gap="200" blockAlign="center">
                  <Text as="p" variant="bodyMd">
                    {variant.variantTitle}{" "}
                    {variant.variantPrice && `- ₹${variant.variantPrice}`}
                  </Text>
                  <Badge tone={badgeTone}>{badgeText}</Badge>
                  {showPdfName && assignedPdf && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      ({assignedPdf.name})
                    </Text>
                  )}
                </InlineStack>
              </List.Item>
            );
          })}
        </List>
      ) : (
        <Text as="p" variant="bodySm" tone="subdued">
          {emptyMessage}
        </Text>
      )}
    </BlockStack>
  );
}

