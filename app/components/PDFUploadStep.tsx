import {
  Card,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Icon,
  Divider,
} from "@shopify/polaris";
import { UploadIcon, DeleteIcon, ViewIcon } from "@shopify/polaris-icons";

interface UploadedPDF {
  id: string;
  name: string;
  size: string;
  variantId?: string;
}

interface VariantOption {
  label: string;
  value: string;
}

interface PDFUploadStepProps {
  uploadedPDFs: UploadedPDF[];
  availableVariants: VariantOption[];
  isUploading: boolean;
  onUpload: () => void;
  onRemove: (pdfId: string) => void;
  onClearAll: () => void;
  onBack: () => void;
  onContinue: () => void;
}

export function PDFUploadStep({
  uploadedPDFs,
  availableVariants,
  isUploading,
  onUpload,
  onRemove,
  onClearAll,
  onBack,
  onContinue,
}: PDFUploadStepProps) {
  return (
    <Card>
      <BlockStack gap="500">
        <BlockStack gap="200">
          <Text as="p" variant="headingLg" fontWeight="bold">
            Upload PDF Files
          </Text>
          <Text as="p" tone="subdued">
            Add PDF documents to your selected product and selected variants
          </Text>
        </BlockStack>
        <Divider />
        <Button
          icon={UploadIcon}
          size="large"
          variant="primary"
          onClick={onUpload}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Choose PDF Files"}
        </Button>
        {uploadedPDFs.length > 0 && (
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="p" variant="headingSm" fontWeight="bold">
                  Uploaded PDFs
                </Text>
                <Button
                  tone="critical"
                  variant="plain"
                  size="slim"
                  onClick={onClearAll}
                  disabled={uploadedPDFs.length === 0}
                >
                  Remove All
                </Button>
              </InlineStack>
              <BlockStack gap="300">
                {uploadedPDFs.map((pdf) => {
                  const variantInfo = availableVariants.find(
                    (v) => v.value === pdf.variantId
                  );
                  return (
                    <Card key={pdf.id} background="bg-surface-secondary">
                      <InlineStack
                        align="space-between"
                        blockAlign="center"
                      >
                        <InlineStack gap="400" blockAlign="center">
                          <Icon source={ViewIcon} tone="base" />
                          <BlockStack gap="100">
                            <Text
                              as="p"
                              variant="bodyMd"
                              fontWeight="medium"
                            >
                              {pdf.name}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {pdf.size} • Mapped to:{" "}
                              {variantInfo?.label || "Unknown variant"}
                            </Text>
                          </BlockStack>
                        </InlineStack>
                        <InlineStack gap="200">
                          <Button
                            size="slim"
                            tone="critical"
                            variant="plain"
                            icon={DeleteIcon}
                            onClick={() => onRemove(pdf.id)}
                          />
                        </InlineStack>
                      </InlineStack>
                    </Card>
                  );
                })}
              </BlockStack>
            </BlockStack>
          </Card>
        )}
        <InlineStack align="space-between">
          <Button onClick={onBack} size="large">
            Back to Variant Selection
          </Button>
          <Button
            onClick={onContinue}
            size="large"
            variant="primary"
            disabled={uploadedPDFs.length === 0}
          >
            Review & Save
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

