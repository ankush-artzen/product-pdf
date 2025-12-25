import {
  Card,
  Text,
  Button,
  Thumbnail,
  InlineStack,
  BlockStack,
  Badge,
  List,
  Divider,
} from "@shopify/polaris";

interface Product {
  id: string;
  title: string;
  image?: string;
}

interface UploadedPDF {
  id: string;
  name: string;
  size: string;
  variantId?: string;
}

interface VariantOption {
  label: string;
  value: string;
  price?: string;
}

interface ReviewStepProps {
  product: Product;
  selectedVariantIds: string[];
  availableVariants: VariantOption[];
  uploadedPDFs: UploadedPDF[];
  isUploading: boolean;
  onBack: () => void;
  onSave: () => void;
  fallbackImage: string;
}

export function ReviewStep({
  product,
  selectedVariantIds,
  availableVariants,
  uploadedPDFs,
  isUploading,
  onBack,
  onSave,
  fallbackImage,
}: ReviewStepProps) {
  return (
    <Card>
      {/* <BlockStack gap="500"> */}
        {/* <BlockStack gap="200">
          <Text as="p" variant="headingLg" fontWeight="bold">
            Review & Save
          </Text>
          <Text as="p" tone="subdued">
            Confirm your product, variant selection, and PDF attachments before
            saving
          </Text>
        </BlockStack> */}
        {/* <Divider /> */}
        {/* <Card>
          <BlockStack gap="400">
            <Text as="p" variant="headingSm" fontWeight="bold">
              Product Details
            </Text>
            <InlineStack align="start" gap="400" blockAlign="center">
              <Thumbnail
                size="large"
                source={product.image || fallbackImage}
                alt={product.title}
              />
              <BlockStack gap="100">
                <Text as="p" variant="bodyLg" fontWeight="bold">
                  {product.title}
                </Text>
                 <Text as="p" variant="bodySm" tone="subdued">
                  ID: {product.id}
                </Text> 
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Card> */}
        {/* <Card> */}
          {/* <BlockStack gap="400">
            <Text as="p" variant="headingSm" fontWeight="bold">
              Variant Selection
            </Text>
            <InlineStack align="space-between">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Attached to:
              </Text>
              <Badge tone="info">{`${selectedVariantIds.length} selected variants`}</Badge>
            </InlineStack>
            <List type="bullet">
              {selectedVariantIds.map((variantId) => {
                const variant = availableVariants.find(
                  (v) => v.value === variantId
                );
                return (
                  <List.Item key={variantId}>
                    <Text as="p" variant="bodyMd">
                      {variant?.label || variantId}
                      {variant?.price && ` — ${variant.price}`}
                    </Text>
                  </List.Item>
                );
              })}
            </List>
          </BlockStack> */}
        {/* </Card> */}
        {/* <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="p" variant="headingSm" fontWeight="bold">
                PDF Attachments
              </Text>
              <Text as="p">{uploadedPDFs.length.toString()} files</Text>
            </InlineStack>
            <List type="bullet">
              {uploadedPDFs.map((pdf) => {
                const variantInfo = availableVariants.find(
                  (v) => v.value === pdf.variantId
                );
                return (
                  <List.Item key={pdf.id}>
                    <InlineStack align="start" gap="300" blockAlign="center">
                      <Text as="p" variant="bodyMd">
                        {pdf.name}
                      </Text>
                      <Badge tone="success">{pdf.size}</Badge>
                      <Badge tone="info">
                        {variantInfo?.label || "Unmapped"}
                      </Badge>
                    </InlineStack>
                  </List.Item>
                );
              })}
            </List>
          </BlockStack>
        </Card> */}
        {/* <InlineStack align="end">
          <Button
            size="large"
            variant="primary"
            tone="success"
            onClick={onSave}
            disabled={uploadedPDFs.length === 0}
            loading={isUploading}
          >
            {isUploading ? "Saving..." : "Save PDF Attachments"}
          </Button>
        </InlineStack> */}
      {/* </BlockStack> */}
    </Card>
  );
}
