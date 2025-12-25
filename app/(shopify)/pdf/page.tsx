"use client";

import { useEffect, useState } from "react";
import {
  Page,
  Card,
  Text,
  Badge,
  Spinner,
  Box,
  Icon,
  Button,
  Divider,
  InlineStack,
  BlockStack,
  Thumbnail,
  Modal,
  IndexTable,
  useIndexResourceState,
  Tooltip,
} from "@shopify/polaris";
import {
  RefreshIcon,
  DeleteIcon,
  EditIcon,
  ViewIcon,
  AttachmentIcon,
  NoteIcon,
  ProductIcon,
} from "@shopify/polaris-icons";
import { useRouter } from "next/navigation";
import { useAppBridge } from "@shopify/app-bridge-react";

interface PDF {
  [key: string]: any;
  id: string;
  name: string;
  size: string;
  url: string;
  uploadedAt: string;
  uploadedAtDate: Date;
  variantId?: string;
  variantTitle?: string;
  productId: string;
  productTitle?: string;
  productImage?: string;
  productStatus?: string;
  
}

interface ProductPDF {
  id: string;
  productId: string;
  productTitle?: string;
  productImage?: string;
  productStatus?: string;
  pdfs: PDF[];
  
}

const truncateText = (text: string, maxLength: number = 40): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};

const formatFileSize = (size: string): string => {
  if (!size) return "0 KB";
  const numSize = parseInt(size);
  if (Number.isNaN(numSize)) return size;
  if (numSize < 1024) return `${numSize} B`;
  if (numSize < 1024 * 1024) return `${(numSize / 1024).toFixed(1)} KB`;
  return `${(numSize / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function ProductPDFListPage() {
  const app = useAppBridge();
  const router = useRouter();

  // Shop context
  const [shop, setShop] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
 
  const [products, setProducts] = useState<ProductPDF[]>([]);
  const [flatPDFs, setFlatPDFs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<PDF | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    const shopFromConfig = (app as any)?.config?.shop;
    if (shopFromConfig) setShop(shopFromConfig);
    else setError("Unable to retrieve shop info. Please reload the app.");
  }, [app]);
console.log("shopppppppp",shop)
  console.log("shopppppppp", shop);


  const fetchProducts = async () => {
    try {
      setLoading(true);
      setAuthError(null);

      if (!shop) {
        console.error("Shop not available");
        return;
      }
      const response = await fetch(
        `/api/product-pdfs?shop=${encodeURIComponent(shop)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        setAuthError(result.message || "Failed to fetch PDFs");
        return;
      }

      const grouped: Record<string, ProductPDF> = {};
      const allPDFs: PDF[] = [];

      result.data.forEach((item: any) => {
        const productId = String(item.productId);

        if (!grouped[productId]) {
          grouped[productId] = {
            id: productId,
            productId,
            productTitle: item.productTitle,
            productImage: item.productImage,
            productStatus: item.productStatus,
            pdfs: [],
          };
        }

        const pdf: PDF = {
          id: String(item.pdfId),
          name: item.pdfName,
          size: item.pdfSize,
          url: item.pdfUrl,
          uploadedAt: item.uploadedAt,
          uploadedAtDate: new Date(item.uploadedAt), 
          variantId: item.variantId,
          variantTitle: item.variantTitle,
          productId: item.productId,
          productTitle: item.productTitle,
          productImage: item.productImage,
          productStatus: item.productStatus,
        };
        
        grouped[productId].pdfs.push(pdf);
        allPDFs.push(pdf);
      });

      setProducts(Object.values(grouped));
      setFlatPDFs(allPDFs);
    } catch (err) {
      console.error("Fetch error:", err);
      setAuthError("Error loading PDFs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (shop) {
      fetchProducts();
    }
  }, [shop]);
  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const resourceName = {
    singular: "PDF file",
    plural: "PDF files",
  };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState<PDF>(flatPDFs);

  const viewPDF = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDelete = (pdf: PDF) => {
    setSelectedPDF(pdf);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPDF || !shop || !selectedPDF.productId) {
      alert("Missing required data");
      return;
    }
  
    try {
      const res = await fetch("/api/product-pdfs/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop,
          productId: selectedPDF.productId,
          pdfId: selectedPDF.id,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }
  
      setDeleteModalOpen(false);
      setSelectedPDF(null);
      fetchProducts(); // 🔁 refresh list
  
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(err.message);
    }
  };
  
  

  // const bulkDelete = async () => {
  //   if (selectedResources.length === 0) return;

  //   try {
  //     setSaving(true);
  //     const pdfsToDelete = flatPDFs.filter((pdf) =>
  //       selectedResources.includes(pdf.id)
  //     );

  //     const deletePromises = pdfsToDelete.map((pdf) =>
  //       fetch("/api/product-pdfs/delete", {
  //         method: "DELETE",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           pdfId: pdf.id,
  //           pdfUrl: pdf.url,
  //         }),
  //       })
  //     );

  //     await Promise.all(deletePromises);

  //     // re-fetch to keep things simple & consistent
  //     await fetchProducts();
  //   } catch (err) {
  //     console.error("Bulk delete error:", err);
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const rowMarkup = flatPDFs.map((pdf, index) => (
    <IndexTable.Row id={pdf.id} key={pdf.id} position={index}>
      <IndexTable.Cell>
        <InlineStack gap="200" align="start">
          {pdf.productImage ? (
            <Thumbnail source={pdf.productImage} size="small" alt={""} />
          ) : (
            <Icon source={ProductIcon} tone="subdued" />
          )}
          <Text variant="bodySm" as="span">
            {truncateText(pdf.productTitle || "", 30)}
          </Text>
        </InlineStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <InlineStack gap="200" align="start">
          <BlockStack gap="100">
            <Tooltip content={pdf.name}>
              <Text variant="bodySm" fontWeight="medium" as="span">
                {truncateText(pdf.name, 20)}
              </Text>
            </Tooltip>

            <InlineStack gap="100">
              {/* <Text variant="bodySm" tone="subdued" as="span">
                {formatFileSize(pdf.size)}
              </Text> */}
              {/* <Text as="span" variant="bodySm" tone="subdued">
                •
              </Text> */}
              <Text variant="bodySm" tone="subdued" as="span">
                {formatDate(pdf.uploadedAt)}
              </Text>
            </InlineStack>
          </BlockStack>
        </InlineStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Tooltip content={pdf.variantTitle}>
          {pdf.variantTitle ? (
            <Badge size="small" tone="info">
              {truncateText(pdf.variantTitle, 20)}
            </Badge>
          ) : (
            <Badge size="small">Default</Badge>
          )}
        </Tooltip>
      </IndexTable.Cell>

      {/* <IndexTable.Cell>
        {pdf.productStatus === "active" ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="critical">Draft</Badge>
        )}
      </IndexTable.Cell> */}

      <IndexTable.Cell>
        <InlineStack gap="300" align="start">
          <Tooltip content="View PDF">
            <Button
              size="micro"
              icon={ViewIcon}
              onClick={() => viewPDF(pdf.url)}
              accessibilityLabel="View PDF"
            />
          </Tooltip>
          <Tooltip content="Edit PDF">
            <Button
              size="micro"
              icon={EditIcon}
              onClick={() => router.push(`/pdf/edit/${pdf.id}`)}
              accessibilityLabel="Edit PDF"
            />
          </Tooltip>
          <Tooltip content="Delete PDF">
            <Button
              size="micro"
              tone="critical"
              icon={DeleteIcon}
              onClick={() => handleDelete(pdf)}
              accessibilityLabel="Delete PDF"
            />
          </Tooltip>
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Product PDF Library"
      subtitle={`${flatPDFs.length} PDF files across ${products.length} products`}
      primaryAction={{
        content: "Add PDF",
        onAction: () => router.push("/pdf/create"),
        icon: AttachmentIcon,
      }}
      // secondaryActions={[
      //   {
      //     content: "Refresh",
      //     icon: RefreshIcon,
      //     onAction: handleRefresh,
      //     loading: refreshing,
      //   },
      //   selectedResources.length > 0 && {
      //     content: `Delete ${selectedResources.length} selected`,
      //     icon: DeleteIcon,
      //     onAction: bulkDelete,
      //     destructive: true,
      //     loading: saving,
      //   },
      // ].filter(Boolean)}
    >
      {loading ? (
        <Card>
          <Box padding="800">
            <InlineStack gap="400" align="center" blockAlign="center">
              <Spinner size="large" />
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Loading PDF Library...
              </Text>
            </InlineStack>
          </Box>
        </Card>
      ) : authError ? (
        <Card>
          <Box padding="800">
            <BlockStack gap="400" align="center">
              <Box
                background="bg-surface-critical"
                padding="600"
                borderRadius="300"
              >
                <Icon source={ProductIcon} tone="critical" />
              </Box>
              <BlockStack gap="200" align="center">
                <Text
                  as="h2"
                  variant="headingLg"
                  fontWeight="bold"
                  tone="critical"
                >
                  Authentication Error
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                  {authError}
                </Text>
              </BlockStack>
              <InlineStack gap="200">
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
                <Button
                  onClick={() => router.push("/pdf/create")}
                  icon={AttachmentIcon}
                >
                  Add PDF to Product
                </Button>
              </InlineStack>
            </BlockStack>
          </Box>
        </Card>
      ) : flatPDFs.length === 0 ? (
        <Card>
          <Box padding="800">
            <BlockStack gap="400" align="center">
              <Box
                background="bg-surface-secondary"
                padding="600"
                borderRadius="300"
              >
                <Icon source={ProductIcon} tone="subdued" />
              </Box>
              <BlockStack gap="200" align="center">
                <Text as="h2" variant="headingLg" fontWeight="bold">
                  No PDFs Found
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                  You haven't uploaded any PDF files to products yet.
                </Text>
              </BlockStack>
              <Button
                variant="primary"
                onClick={() => router.push("/pdf/create")}
                icon={AttachmentIcon}
              >
                Add PDF to Product
              </Button>
            </BlockStack>
          </Box>
        </Card>
      ) : (
        <Card padding="0">
          <IndexTable
            selectable={false}
            resourceName={resourceName}
            itemCount={flatPDFs.length}
            selectedItemsCount={
              allResourcesSelected ? "All" : selectedResources.length
            }
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Product" },
              { title: "PDF File" },
              { title: "Variant" },
              // { title: "Status" },
              { title: "Actions" },
            ]}
            // promotedBulkActions={[
            //   {
            //     content: "Delete selected",
            //     onAction: bulkDelete,
            //     icon: DeleteIcon,
            //   },
            // ]}
            emptyState={
              <Box padding="800">
                <BlockStack gap="400" align="center">
                  <Icon source={NoteIcon} tone="subdued" />
                  <BlockStack gap="200" align="center">
                    <Text as="h3" variant="headingMd" fontWeight="medium">
                      No PDFs match your search
                    </Text>
                    <Text
                      as="p"
                      variant="bodyMd"
                      tone="subdued"
                      alignment="center"
                    >
                      Try adjusting your filters or search term
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Box>
            }
          >
            {rowMarkup}
          </IndexTable>
        </Card>
      )}

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete PDF"
        primaryAction={{
          content: "Delete",
          onAction: confirmDelete,
          loading: saving,
          destructive: true,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setDeleteModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {selectedPDF && (
              <>
                <Text as="p" variant="bodyMd">
                  Delete "{truncateText(selectedPDF.name, 50)}"?
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  This PDF is attached to:{" "}
                  <strong>{selectedPDF.productTitle}</strong>
                  {selectedPDF.variantTitle && ` (${selectedPDF.variantTitle})`}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  This action cannot be undone.
                </Text>
              </>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
