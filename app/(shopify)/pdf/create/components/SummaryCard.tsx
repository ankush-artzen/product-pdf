import {
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Divider,
} from "@shopify/polaris";

interface SummaryCardProps {
  productTitle?: string;
  selectedVariantCount: number;
  totalVariantCount: number;
  uploadedPDFCount: number;
  currentStep: number;
}

export function SummaryCard({
  productTitle,
  selectedVariantCount,
  totalVariantCount,
  uploadedPDFCount,
  currentStep,
}: SummaryCardProps) {
  if (!productTitle) return null;

  const getStatusText = () => {
    switch (currentStep) {
      case 1:
        return "Selecting";
      case 2:
        return "Choosing Variants";
      case 3:
        return "Uploading";
      case 4:
        return "Ready";
      default:
        return "Ready";
    }
  };

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="p" variant="headingSm" fontWeight="bold">
          Summary
        </Text>
        <Divider />
        <InlineStack align="space-between">
          <Text as="p" variant="bodySm" tone="subdued">
            Product:
          </Text>
          <Text as="p" variant="bodySm" fontWeight="medium">
            {productTitle}
          </Text>
        </InlineStack>
        <InlineStack align="space-between">
          <Text as="p" variant="bodySm" tone="subdued">
            Variants:
          </Text>
          <BlockStack gap="100" align="end">
            <Badge tone="info">{`${selectedVariantCount} selected`}</Badge>
            {selectedVariantCount > 0 && (
              <Text as="p" variant="bodySm" tone="subdued">
                {selectedVariantCount === totalVariantCount
                  ? "All variants"
                  : `${selectedVariantCount} of ${totalVariantCount}`}
              </Text>
            )}
          </BlockStack>
        </InlineStack>
        <InlineStack align="space-between">
          <Text as="p" variant="bodySm" tone="subdued">
            PDFs Attached:
          </Text>
          <Badge tone={uploadedPDFCount > 0 ? "success" : "critical"}>
            {uploadedPDFCount.toString()}
          </Badge>
        </InlineStack>
        <InlineStack align="space-between">
          <Text as="p" variant="bodySm" tone="subdued">
            Status:
          </Text>
          <Badge tone={currentStep === 4 ? "success" : "attention"}>
            {getStatusText()}
          </Badge>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

