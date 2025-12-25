"use client";

import {
  reactExtension,
  Banner,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Divider,
  Icon,
  List,
  ListItem,
  Spinner,
  useApi,
  useCartLines,
  useTranslate,
  Link,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useEffect } from "react";

// Types for our database response
interface PDFData {
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: string;
  variantId: string;
  variantTitle: string;
  variantPrice: string;
  pdfId: string;
  pdfName: string;
  pdfSize: string;
  pdfUrl: string;
  uploadedAt: string;
  path: string;
}

interface CartLineItem {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
    };
  };
}

interface EnhancedCartItem extends CartLineItem {
  pdfData?: PDFData;
}

export default reactExtension("purchase.thank-you.block.render", () => (
  <Extension />
));

function Extension() {
  const translate = useTranslate();
  const { extension } = useApi();
  const cartLines = useCartLines();

  const [pdfData, setPdfData] = useState<PDFData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [downloadLinks, setDownloadLinks] = useState<Record<string, string>>(
    {}
  );
  const appurl = `https://product-pdf.vercel.app`;
  const fetchPDFs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${appurl}/api/product-pdfs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPdfData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch PDF data");
      }
    } catch (err) {
      console.error("Error fetching PDFs:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const extractNumericId = (gid: string): string => {
    const match = gid.match(/\/(\d+)$/);
    return match ? match[1] : "";
  };

  // const handleDownloadPDF = async (variantId: string, pdfName: string) => {
  //   const numericId = extractNumericId(variantId);
  //   if (!numericId) return;

  //   try {
  //     setDownloading(prev => ({ ...prev, [variantId]: true }));

  //     const downloadUrl = `${numericId}`;

  //     // Create a temporary anchor element to trigger download
  //     const response = await fetch(downloadUrl);
  //     if (!response.ok) throw new Error("Failed to download PDF");

  //     const blob = await response.blob();
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = pdfName || "product-manual.pdf";
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     window.URL.revokeObjectURL(url);
  //   } catch (err) {
  //     console.error("Download error:", err);
  //     setError("Failed to download PDF. Please try again.");
  //   } finally {
  //     setDownloading(prev => ({ ...prev, [variantId]: false }));
  //   }
  // };
  const handleDownloadPDF = async (variantId: string, pdfId: string) => {
    try {
      setDownloading((prev) => ({ ...prev, [variantId]: true }));

      // 1️⃣ Create token
      const tokenRes = await fetch(`${appurl}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          pdfId,
        }),
      });

      if (!tokenRes.ok) throw new Error("Token creation failed");

      const { token } = await tokenRes.json();

      // 2️⃣ Redirect browser to download URL
      const downloadLink = `${appurl}/api/download/${token}`;

      setDownloadLinks((prev) => ({ ...prev, [variantId]: downloadLink }));
      // Option B: If you have access to the order object, you might want to
      // use Shopify's download capabilities
      console.log("Download initiated for", variantId);
    } catch (err) {
      console.error("Download error:", err);
      setError("Unable to download file. Link may be expired.");
    } finally {
      setDownloading((prev) => ({ ...prev, [variantId]: false }));
    }
  };

  const getMatchingPDFs = (): EnhancedCartItem[] => {
    if (!cartLines || !pdfData.length) return [];

    return cartLines
      .filter((lineItem: any) => {
        return pdfData.some((pdf) => pdf.variantId === lineItem.merchandise.id);
      })
      .map((lineItem: any) => {
        const matchingPdf = pdfData.find(
          (pdf) => pdf.variantId === lineItem.merchandise.id
        );
        return {
          ...lineItem,
          pdfData: matchingPdf,
        };
      });
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const pdfLineItems = getMatchingPDFs();

  // Loading state
  if (loading) {
    return (
      <BlockStack
        spacing="base"
        padding="base"
        border="base"
        borderRadius="large"
      >
        <InlineStack spacing="base" blockAlignment="center">
          <Spinner />
          <Text appearance="subdued">Loading your product manuals...</Text>
        </InlineStack>
      </BlockStack>
    );
  }

  // Error state
  if (error) {
    return (
      <BlockStack
        spacing="base"
        padding="base"
        border="base"
        borderRadius="large"
      >
        <Banner status="critical">
          <BlockStack spacing="tight">
            <Text>Unable to load PDF downloads. Please try again later.</Text>
            <Button onPress={fetchPDFs}>Retry</Button>
          </BlockStack>
        </Banner>
      </BlockStack>
    );
  }

  // No PDFs available
  if (pdfLineItems.length === 0) {
    return (
      <BlockStack
        spacing="base"
        padding="base"
        border="base"
        borderRadius="large"
      >
        <Banner status="info">
          <BlockStack spacing="tight">
            <Text emphasis="bold">Product Manuals</Text>
            <Text appearance="subdued">
              No manuals are available for your purchased items.
            </Text>
          </BlockStack>
        </Banner>
      </BlockStack>
    );
  }

  return (
    <BlockStack
      spacing="base"
      padding="base"
      border="base"
      borderRadius="large"
    >
      <Banner status="success">
        <BlockStack spacing="tight">
          <Text emphasis="bold">Download Your Product Manuals</Text>
          <Text>
            Access manuals for your purchased items below. Downloads will start
            automatically when you click the buttons.
          </Text>
        </BlockStack>
      </Banner>

      <Divider />

      <List spacing="loose">
        {pdfLineItems.map((item, index) => (
          <ListItem key={`${item.id}-${index}`}>
            <BlockStack
              spacing="tight"
              padding="tight"
              border="base"
              borderRadius="base"
            >
              <InlineStack spacing="base" blockAlignment="center">
                <BlockStack spacing="extraTight">
                  <Text emphasis="bold">
                    {item.merchandise.product?.title || item.merchandise.title}
                  </Text>
                  {item.merchandise.title !==
                    item.merchandise.product?.title && (
                    <Text appearance="subdued">{item.merchandise.title}</Text>
                  )}
                </BlockStack>
              </InlineStack>

              {item.pdfData && (
                // <BlockStack
                //   spacing="base"
                //   padding="tight"
                //   border="base"
                //   borderRadius="base"
                // >
                <InlineStack spacing="base" blockAlignment="center">
                  {/* <BlockStack spacing="extraTight">
                      <Text emphasis="bold">{item.pdfData.pdfName}</Text>
                      <Text appearance="subdued">{item.pdfData.pdfSize}</Text>
                    </BlockStack> */}
                  <InlineStack>
                    {downloadLinks[item.merchandise.id] ? (
                      <BlockStack spacing="extraTight">
                        <Text size="small">Click to download:</Text>
                        <Link to={downloadLinks[item.merchandise.id]} external>
                          Download PDF
                        </Link>
                      </BlockStack>
                    ) : (
                      <Button
                        loading={downloading[item.merchandise.id]}
                        onPress={() =>
                          handleDownloadPDF(
                            item.merchandise.id,
                            item.pdfData!.pdfId
                          )
                        }
                        kind="secondary"
                      >
                        <Icon source="external" />
                        &nbsp; Generate Download Link
                      </Button>
                    )}
                  </InlineStack>
                </InlineStack>
                // </BlockStack>
              )}
            </BlockStack>
          </ListItem>
        ))}
      </List>

      <Divider />

      <Banner status="info">
        <BlockStack spacing="tight">
          <Text emphasis="bold">Need help with your products?</Text>
          <Text appearance="subdued">
            These manuals contain important safety information and usage
            instructions. Keep them for future reference.
          </Text>
        </BlockStack>
      </Banner>
    </BlockStack>
  );
}
