import {
  BlockStack,
  Text,
  Button,
  InlineStack,
  Box,
  Icon,
  Card,
  Banner,
  Badge,
  Layout,
} from "@shopify/polaris";
import { UploadIcon, DeleteIcon } from "@shopify/polaris-icons";

interface UploadedPDF {
  id: string;
  name: string;
  size: string;
  variantId: string;
}

interface Variant {
  variantId: string;
  variantTitle: string;
  variantPrice?: string;
}

interface PDF {
  variantId?: string;
}

interface PDFUploadSectionProps {
  uploadedPDFs: UploadedPDF[];
  productVariants: Variant[];
  existingAttachments: PDF[];
  selectedVariant: string;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUpload: () => void;
  onRemove: (pdfId: string) => void;
  onClearAll: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReviewAndSave: () => void;
}

export function PDFUploadSection({
  uploadedPDFs,
  productVariants,
  existingAttachments,
  selectedVariant,
  isUploading,
  fileInputRef,
  onUpload,
  onRemove,
  onClearAll,
  onFileChange,
  onReviewAndSave,
}: PDFUploadSectionProps) {
  return (
    <Layout>
      {/* LEFT / MAIN SECTION */}

      <Layout.Section>
        <BlockStack gap="300">
          <Text as="h3" variant="headingMd" fontWeight="bold">
            Attach pdf to variants{" "}
          </Text>
          {selectedVariant &&
            existingAttachments.some(
              (att) => att.variantId === selectedVariant
            ) && (
              <Banner
                title=" This variant already has a PDF attached. Uploading a new PDF will
              replace the existing one"
                tone="info"
              />
            )}

          <Box
            padding="600"
            background="bg-surface-secondary"
            borderRadius="200"
            borderStyle="dashed"
          >
            <BlockStack gap="400" align="center">
              <Icon source={UploadIcon} tone="subdued" />

              <BlockStack gap="100" align="center">
                <Text
                  as="p"
                  variant="bodyMd"
                  fontWeight="medium"
                  alignment="center"
                >
                  Upload your PDF file
                </Text>
                <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                  Maximum file size: 10MB • One PDF per variant • PDF format
                  only
                </Text>
              </BlockStack>

              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
              />
              {/* <InlineStack align="center"> */}
              <Button
                size="large"
                variant="primary"
                onClick={onUpload}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Choose PDF File"}
              </Button>
              {/* </InlineStack> */}
            </BlockStack>
          </Box>

          {uploadedPDFs.length > 0 && (
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="p" variant="headingSm" fontWeight="bold">
                    Uploaded PDFs ({uploadedPDFs.length})
                  </Text>

                
                </InlineStack>

                {/* <Text as="p" variant="bodySm" tone="subdued">
                  Each variant can have only one PDF. Uploading a new PDF for a
                  variant will replace the existing one.
                </Text> */}

                {uploadedPDFs.map((uploadedPdf) => {
                  const variantInfo = productVariants.find(
                    (v) => v.variantId === uploadedPdf.variantId
                  );
                  const existingAttachment = existingAttachments.find(
                    (att) => att.variantId === uploadedPdf.variantId
                  );

                  return (
                    <Card
                      key={uploadedPdf.id}
                      background={
                        existingAttachment
                          ? "bg-surface-warning"
                          : "bg-surface-success"
                      }
                    >
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="400" blockAlign="center">
                          <BlockStack gap="100">
                            <Text as="p" variant="bodyMd" fontWeight="medium">
                              {uploadedPdf.name}
                              {/* {existingAttachment && (
                                <Badge tone="warning" size="small">
                                  This Will Replace Existing PDF
                                </Badge>
                              )} */}
                            </Text>

                            <InlineStack gap="200">
                              <Badge tone="success">
                                {`Variant: ${variantInfo?.variantTitle || "Unknown"}`}
                              </Badge>
                           
                            </InlineStack>
                          </BlockStack>
                        </InlineStack>

                        <InlineStack gap="200">
                          <Button
                            size="slim"
                            tone="critical"
                            variant="plain"
                            icon={DeleteIcon}
                            onClick={() => onRemove(uploadedPdf.id)}
                          />
                        </InlineStack>
                      </InlineStack>
                      
                    </Card>
                  );
                })}
                  <InlineStack gap="200" align="end">
                    <Button
                      tone="critical"
                      variant="plain"
                      size="slim"
                      onClick={onClearAll}
                    >
                      Remove 
                    </Button>
                    <Button
                      variant="primary"
                      tone="success"
                      onClick={onReviewAndSave}
                      loading={isUploading}
                    >
                      Review & Save
                    </Button>
                  </InlineStack>
              </BlockStack>
            </Card>
          )}
        </BlockStack>
      </Layout.Section>
    </Layout>
  );
}
