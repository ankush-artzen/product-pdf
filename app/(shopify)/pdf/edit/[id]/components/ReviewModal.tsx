import {
  Modal,
  BlockStack,
  Banner,
  Card,
  Text,
  InlineStack,
  Thumbnail,
  List,
  Badge,
  Icon,
} from "@shopify/polaris";
import { SaveIcon, CheckIcon, DeleteIcon, UploadIcon } from "@shopify/polaris-icons";

interface UploadedPDF {
  id: string;
  name: string;
  size: string;
  variantId: string;
  variantTitle?: string;
}

interface PDF {
  id: string;
  name: string;
  size: string;
  variantId?: string;
  variantTitle?: string;
}

interface Variant {
  variantId: string;
  variantTitle: string;
  variantPrice?: string;
}

interface ProductWithVariants {
  productTitle: string;
  productImage?: string;
  productPrice?: string;
  variants: Variant[];
}

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  uploading: boolean;
  selectedProduct: ProductWithVariants | null;
  productVariants: Variant[];
  existingAttachments: PDF[];
  uploadedPDFs: UploadedPDF[];
  pdfsToReplace: PDF[];
}

export function ReviewModal({
  open,
  onClose,
  onSave,
  uploading,
  selectedProduct,
  productVariants,
  existingAttachments,
  uploadedPDFs,
  pdfsToReplace,
}: ReviewModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review & Save PDFs"
      primaryAction={{
        content: "Save All PDFs",
        onAction: onSave,
        loading: uploading,
        icon: SaveIcon,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
      size="large"
    >
      <Modal.Section>
        <BlockStack gap="600">
          <Banner tone="success">
            <Text as="p" variant="bodyMd">
              <InlineStack gap="200" align="center">
                <Icon source={CheckIcon} />
                <span>Review your PDF uploads before saving</span>
              </InlineStack>
            </Text>
          </Banner>

          {selectedProduct && (
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd" fontWeight="bold">
                  Product Information
                </Text>
                <InlineStack gap="400" blockAlign="center">
                  {selectedProduct.productImage && (
                    <Thumbnail
                      source={selectedProduct.productImage}
                      alt={selectedProduct.productTitle || "Product"}
                      size="medium"
                    />
                  )}
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      {selectedProduct.productTitle}
                    </Text>
                    {selectedProduct.productPrice && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        Product Price: ₹{selectedProduct.productPrice}
                      </Text>
                    )}
                    <Text as="p" variant="bodySm" tone="subdued">
                      {selectedProduct.variants.length} variants total
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>
          )}

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                Variant List
              </Text>
              <List>
                {productVariants.map((variant) => {
                  const hasExistingPdf = existingAttachments.some(
                    (att) => att.variantId === variant.variantId
                  );
                  const hasNewPdf = uploadedPDFs.some(
                    (up) => up.variantId === variant.variantId
                  );

                  return (
                    <List.Item key={variant.variantId}>
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Text as="p" variant="bodyMd">
                            {variant.variantTitle}
                          </Text>
                          {variant.variantPrice && (
                            <Text as="p" variant="bodySm" tone="subdued">
                              Price: ₹{variant.variantPrice}
                            </Text>
                          )}
                        </BlockStack>

                        <BlockStack gap="100" align="end">
                          {hasNewPdf && <Badge tone="success">New PDF</Badge>}
                          {hasExistingPdf && !hasNewPdf && (
                            <Badge tone="info">Has PDF</Badge>
                          )}
                          {!hasExistingPdf && !hasNewPdf && (
                            <Badge tone="info">No PDF</Badge>
                          )}
                        </BlockStack>
                      </InlineStack>
                    </List.Item>
                  );
                })}
              </List>
            </BlockStack>
          </Card>

          {pdfsToReplace.length > 0 && (
            <Card background="bg-surface-warning">
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd" fontWeight="bold">
                  Existing PDFs Being Replaced ({pdfsToReplace.length})
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  These existing PDFs will be replaced with new uploads
                </Text>
                {pdfsToReplace.map((pdf) => {
                  const newPdf = uploadedPDFs.find(
                    (up) => up.variantId === pdf.variantId
                  );
                  return (
                    <Card key={pdf.id}>
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <InlineStack gap="200" blockAlign="center">
                            <Icon source={DeleteIcon} tone="critical" />
                            <Text as="p" variant="bodyMd" fontWeight="medium">
                              {pdf.name}
                            </Text>
                          </InlineStack>
                          <InlineStack gap="200">
                            <Badge tone="critical">{pdf.size}</Badge>
                            <Badge tone="info">
                              {`Variant: ${pdf.variantTitle || "Unknown"}`}
                            </Badge>
                          </InlineStack>
                        </BlockStack>

                        {newPdf && (
                          <BlockStack gap="100" align="end">
                            <InlineStack gap="100" blockAlign="center">
                              <Text as="p" variant="bodySm" tone="subdued">
                                Replaced by:
                              </Text>
                              <Badge tone="success">{newPdf.name}</Badge>
                            </InlineStack>
                          </BlockStack>
                        )}
                      </InlineStack>
                    </Card>
                  );
                })}
              </BlockStack>
            </Card>
          )}

          <Card background="bg-surface-success">
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                New PDFs to Upload ({uploadedPDFs.length})
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                These PDFs will be uploaded and attached to their respective
                variants
              </Text>
              {uploadedPDFs.map((uploadedPdf) => {
                const variantInfo = productVariants.find(
                  (v) => v.variantId === uploadedPdf.variantId
                );
                const isReplacing = pdfsToReplace.some(
                  (pdf) => pdf.variantId === uploadedPdf.variantId
                );

                return (
                  <Card key={uploadedPdf.id}>
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Icon source={UploadIcon} tone="success" />
                          <Text as="p" variant="bodyMd" fontWeight="medium">
                            {uploadedPdf.name}
                            {isReplacing && (
                              <Badge tone="warning" size="small">
                                Replacing
                              </Badge>
                            )}
                          </Text>
                        </InlineStack>
                        <InlineStack gap="200">
                          <Badge tone="success">{uploadedPdf.size}</Badge>
                          <Badge tone="info">
                            {`Variant: ${variantInfo?.variantTitle || uploadedPdf.variantTitle || "Unknown"}`}
                          </Badge>
                          {variantInfo?.variantPrice && (
                            <Badge tone="info">
                              {`Price: ₹${variantInfo.variantPrice}`}
                            </Badge>
                          )}
                        </InlineStack>
                      </BlockStack>

                      <Badge tone={isReplacing ? "warning" : "success"}>
                        {isReplacing ? "Replace" : "New"}
                      </Badge>
                    </InlineStack>
                  </Card>
                );
              })}
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                Upload Summary
              </Text>
              <List>
                <List.Item>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd">
                      Total PDFs to upload:
                    </Text>
                    <Badge tone="info">{uploadedPDFs.length.toString()}</Badge>
                  </InlineStack>
                </List.Item>
                <List.Item>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd">
                      Existing PDFs to replace:
                    </Text>
                    <Badge tone="warning">
                      {pdfsToReplace.length.toString()}
                    </Badge>
                  </InlineStack>
                </List.Item>
                <List.Item>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd">
                      New variants getting PDFs:
                    </Text>
                    <Badge tone="success">
                      {(uploadedPDFs.length - pdfsToReplace.length).toString()}
                    </Badge>
                  </InlineStack>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

