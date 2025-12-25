import {
  Card,
  Text,
  Button,
  Thumbnail,
  InlineStack,
  BlockStack,
  Box,
  Divider,
} from "@shopify/polaris";

interface Product {
  id: string;
  title: string;
  image?: string;
}

interface ProductSelectionStepProps {
  selectedProduct: Product | null;
  onSelectProduct: () => void;
  onClearProduct: () => void;
  variantCount: number;
  onContinue: () => void;
  fallbackImage: string;
}

export function ProductSelectionStep({
  selectedProduct,
  onSelectProduct,
  onClearProduct,
  variantCount,
  onContinue,
  fallbackImage,
}: ProductSelectionStepProps) {
  return (
    <Card>
      <BlockStack gap="500">
        <BlockStack gap="200">
          <Text as="p" variant="headingLg" fontWeight="bold">
            Select Product
          </Text>
          <Text as="p" tone="subdued">
            Choose the product you want to attach PDF files to
          </Text>
        </BlockStack>
        <Divider />
        <Button variant="primary" size="large" onClick={onSelectProduct}>
          Browse Products
        </Button>
        {selectedProduct && (
          <>
            <Card background="bg-surface-secondary">
              <InlineStack align="start" gap="400" blockAlign="center">
                <Thumbnail
                  size="large"
                  source={selectedProduct.image || fallbackImage}
                  alt={selectedProduct.title || "Product image"}
                />
                <Box width="100%">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyLg" fontWeight="bold">
                      {selectedProduct.title}
                    </Text>
                    <Text as="p" tone="subdued">
                      Product ID: {selectedProduct.id}
                    </Text>
                    {variantCount > 0 && (
                      <Text as="p" variant="bodySm" tone="success">
                        {variantCount} variants available
                      </Text>
                    )}
                  </BlockStack>
                </Box>
                <Button variant="plain" tone="critical" onClick={onClearProduct}>
                  Change
                </Button>
              </InlineStack>
            </Card>
            <InlineStack align="end">
              <Button variant="primary" size="large" onClick={onContinue}>
                Continue to Variant Selection
              </Button>
            </InlineStack>
          </>
        )}
      </BlockStack>
    </Card>
  );
}

