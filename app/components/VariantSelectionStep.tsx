import {
  Card,
  Text,
  Button,
  Thumbnail,
  InlineStack,
  BlockStack,
  Box,
  Badge,
  Divider,
  Spinner,
  Icon,
  Grid,
  Checkbox,
  RadioButton,
  InlineGrid,
} from "@shopify/polaris";
import { ViewIcon, CheckIcon, DeleteIcon } from "@shopify/polaris-icons";

interface VariantOption {
  label: string;
  value: string;
  price?: string;
  inventory?: number;
  sku?: string;
}

interface Product {
  id: string;
  title: string;
  image?: string;
  handle?: string;
}

interface VariantSelectionStepProps {
  product: Product;
  availableVariants: VariantOption[];
  selectedVariantIds: string[];
  isLoading: boolean;
  onVariantToggle: (variantId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBack: () => void;
  onContinue: () => void;
  uploadedPDFs: UploadedPDF[];
  isUploading: boolean;
  onUploadPDF: () => void;
  onRemovePDF: (pdfId: string) => void;
  onClearAllPDFs: () => void;
  onSave: () => void;

  fallbackImage: string;
}
interface UploadedPDF {
  id: string;
  name: string;
  size: string;
  variantId?: string;
}

export function VariantSelectionStep({
  product,
  availableVariants,
  selectedVariantIds,
  isLoading,
  onVariantToggle,
  onSelectAll,
  onSave,
  onDeselectAll,
  onBack,
  onContinue,
  uploadedPDFs,
  isUploading,
  onUploadPDF,
  onRemovePDF,
  onClearAllPDFs,
  fallbackImage,
}: VariantSelectionStepProps) {
  const hasVariants = availableVariants.length > 0;
  const hasSelection = selectedVariantIds.length > 0;
  const allSelected = selectedVariantIds.length === availableVariants.length;

  return (
    <Card>
      <BlockStack gap="600">
        {/* Header */}
        <BlockStack gap="200">
          <Text as="h1" variant="headingLg" fontWeight="bold">
            Select Variants
          </Text>
          <Text as="p" tone="subdued">
            Choose which product variants to attach PDFs to
          </Text>
        </BlockStack>
        <Divider />
        {/* PDF Upload Section */}

        {/* Product Info Card */}
        {/* <Card padding="400" background="bg-surface-secondary">
          <InlineStack align="start" gap="400" blockAlign="center">
            <Thumbnail
              size="medium"
              source={product.image || fallbackImage}
              alt={product.title}
            />
            <BlockStack gap="100">
              <Text as="p" variant="bodyLg" fontWeight="semibold">
                {product.title}
              </Text>
              <InlineStack gap="200" blockAlign="center">
                <Badge size="small" tone="success">
                  Active
                </Badge>
                <Text as="p" variant="bodySm" tone="subdued">
                  • {availableVariants.length} variants
                </Text>
              </InlineStack>
            </BlockStack>
          </InlineStack>
        </Card> */}

        {/* Variant Selection Section */}
        <Card padding="0">
          <BlockStack gap="0">
            {/* Selection Header */}
            <Box padding="400" background="bg-surface">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="bodyLg" fontWeight="semibold">
                  Available Variants
                </Text>
                {hasVariants && !isLoading && (
                  <InlineStack gap="200">
                    {/* <Button
                      size="slim"
                      variant="secondary"
                      onClick={allSelected ? onDeselectAll : onSelectAll}
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </Button> */}
                    {hasSelection && (
                      <Button
                        size="slim"
                        variant="plain"
                        tone="critical"
                        onClick={onDeselectAll}
                      >
                        Clear Selection
                      </Button>
                    )}
                  </InlineStack>
                )}
              </InlineStack>
            </Box>

            <Divider />

            {/* Loading State */}
            {isLoading ? (
              <Box padding="800">
                <InlineStack align="center" gap="300">
                  <Spinner size="small" />
                  <Text as="p" tone="subdued">
                    Loading product variants...
                  </Text>
                </InlineStack>
              </Box>
            ) : hasVariants ? (
              <>
                {/* Selection Summary */}
                <Box padding="400" background="bg-surface-secondary">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text
                      as="p"
                      tone="success"
                      variant="bodySm"
                      fontWeight="medium"
                    >
                      Please select variant which you want to attach a pdf
                    </Text>
                  </InlineStack>
                </Box>

                <Divider />

                {/* Variants Grid */}
                <Box padding="400">
                  {/* <Grid columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}> */}
                  <InlineGrid gap="200" columns="3">
                    {availableVariants.map((variant) => {
                      const isSelected = selectedVariantIds.includes(
                        variant.value
                      );

                      return (
                        // <div
                        //   key={variant.value}
                        //   style={{ minWidth: "200px", cursor: "pointer" }}
                        //   onClick={() => onVariantToggle(variant.value)}
                        // >

                        <Card
                          key={variant?.label}
                          padding="200"
                          background={
                            isSelected ? "bg-surface-success" : "bg-surface"
                          }
                        >
                          <BlockStack gap="200">
                            {/* Compact Variant Header */}
                            <InlineStack
                              align="space-between"
                              blockAlign="start"
                            >
                              <Box maxWidth="220px">
                                <Text
                                  as="p"
                                  variant="bodySm"
                                  fontWeight="medium"
                                  truncate
                                >
                                  {variant.label}
                                </Text>
                                {variant.sku && (
                                  <Text
                                    as="p"
                                    variant="bodyXs"
                                    tone="subdued"
                                    truncate
                                  >
                                    {variant.sku}
                                  </Text>
                                )}
                              </Box>
                              {/* {isSelected ? (
                                <Badge tone="success" size="small">
                                  ✓
                                </Badge>
                              ) : (
                                <Badge tone="info" size="small">
                                  ✕
                                </Badge>
                              )} */}
                            </InlineStack>

                            {/* Compact Variant Details */}
                            {/* <BlockStack gap="100">
                              {variant.price && (
                                <Text
                                  as="p"
                                  variant="bodySm"
                                  tone="success"
                                  fontWeight="semibold"
                                >
                                  {variant.price}
                                </Text>
                              )}

                              {variant.inventory !== undefined && (
                                <Badge
                                  tone={
                                    variant.inventory > 10
                                      ? "success"
                                      : variant.inventory > 0
                                        ? "warning"
                                        : "critical"
                                  }
                                  size="small"
                                >
                                  {variant.inventory.toString()}
                                </Badge>
                              )}
                            </BlockStack> */}

                            {/* Compact Checkbox */}

                            <div onClick={(e) => e.stopPropagation()}>
                              <RadioButton
                                label={variant.label}
                                checked={isSelected}
                                name="variant-selection"
                                onChange={() => onVariantToggle(variant.value)}
                              />
                            </div>
                          </BlockStack>
                        </Card>

                        // </div>
                      );
                    })}
                  </InlineGrid>
                  {/* </Grid> */}
                </Box>
              </>
            ) : (
              /* Empty State */
              <Box padding="800">
                <BlockStack gap="400" align="center">
                  <Box
                    background="bg-surface-secondary"
                    borderRadius="full"
                    padding="400"
                  >
                    <Icon source={ViewIcon} tone="subdued" />
                  </Box>
                  <BlockStack gap="100" align="center">
                    <Text as="p" variant="bodyLg" fontWeight="medium">
                      No variants available
                    </Text>
                    <Text as="p" tone="subdued" alignment="center">
                      This product doesn't have any variants to select.
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Box>
            )}
          </BlockStack>
        </Card>
        <Box padding="400">
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="p" variant="bodyLg" fontWeight="semibold">
                Upload PDFs
              </Text>

              {uploadedPDFs.length > 0 && (
                <Button
                  size="slim"
                  tone="critical"
                  variant="plain"
                  onClick={onClearAllPDFs}
                >
                  Remove All
                </Button>
              )}
            </InlineStack>

            <Button
              variant="primary"
              onClick={onUploadPDF}
              disabled={selectedVariantIds.length === 0 || isUploading}
            >
              {isUploading ? "Uploading..." : "Choose PDF Files"}
            </Button>

            {uploadedPDFs.length > 0 && (
              <BlockStack gap="300">
                {uploadedPDFs.map((pdf) => {
                  const variant = availableVariants.find(
                    (v) => v.value === pdf.variantId
                  );

                  return (
                    <Card key={pdf.id} background="bg-surface-secondary">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="300">
                          <Icon source={ViewIcon} />
                          <BlockStack gap="500">
                            <Text as="p" fontWeight="medium">
                              {pdf.name}
                            </Text>
                            {/* <Text as= "p" tone="subdued" variant="bodySm">
                      {pdf.size} • {variant?.label}
                    </Text> */}
                          </BlockStack>
                        </InlineStack>

                        <Button
                          icon={DeleteIcon}
                          variant="plain"
                          tone="critical"
                          onClick={() => onRemovePDF(pdf.id)}
                        />
                      </InlineStack>
                    </Card>
                  );
                })}
              </BlockStack>
            )}
            <InlineStack align="end">
              <Button
                size="large"
                variant="primary"
                onClick={onSave}
                disabled={uploadedPDFs.length === 0}
                loading={isUploading}
              >
                {isUploading ? "Saving..." : "Save PDF Attachments"}
              </Button>
            </InlineStack>
          </BlockStack>
        </Box>

        {/* Navigation Footer */}
        {/* <Box
          padding="400"
          background="bg-surface"
          borderStartStartRadius="200"
          borderStartEndRadius="200"
          borderWidth="025"
          borderColor="border"
        >
          <InlineStack align="space-between" blockAlign="center">
            <Button onClick={onBack} size="large">
              Back to Products
            </Button>

            <BlockStack gap="100" align="end">
              {hasSelection && (
                <Text as="p" variant="bodySm" tone="subdued">
                  {selectedVariantIds.length} variant
                  {selectedVariantIds.length !== 1 ? "s" : ""} selected
                </Text>
              )}
              <Button
  onClick={onContinue}
  size="large"
  variant="primary"
  disabled={uploadedPDFs.length === 0}
>
  Continue to Review
</Button>

             
            </BlockStack>
          </InlineStack>
        </Box> */}
      </BlockStack>
    </Card>
  );
}
