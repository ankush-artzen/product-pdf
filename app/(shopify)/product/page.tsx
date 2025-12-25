"use client";

import { useState, useEffect } from "react";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Spinner,
  Box,
  Thumbnail,
  Button,
  Layout,
} from "@shopify/polaris";
import { useRouter } from "next/navigation";

interface ProductWithVariants {
  id: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  productPrice?: string;
  variants: Array<{
    variantId: string;
    variantTitle: string;
    variantPrice?: string;
    hasPdf: boolean;
  }>;
  pdfs: Array<any>;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/product-pdfs/details");
      const result = await response.json();
      
      if (result.success && result.products) {
        setProducts(result.products);
      } else {
        setError(result.error || "Failed to load products");
      }
    } catch (err) {
      setError("Error loading products");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductClick = (productId: string) => {
    router.push(`/pdf/products/${productId}/variants`);
  };

  if (loading) {
    return (
      <Page title="Products">
        <Box padding="800">
          <InlineStack gap="400" align="center" blockAlign="center">
            <Spinner size="large" />
            <Text as="p" variant="bodyMd">
              Loading products...
            </Text>
          </InlineStack>
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Products"
      primaryAction={{
        content: "Upload PDF",
        onAction: () => router.push("/pdf/upload"),
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {error && (
              <Card>
                <Text as="p" variant="bodyMd" tone="critical">
                  {error}
                </Text>
              </Card>
            )}

            {products.length === 0 ? (
              <Card>
                <Box padding="400">
                  <Text as="p" variant="bodyMd" alignment="center">
                    No products found
                  </Text>
                </Box>
              </Card>
            ) : (
              products.map((product) => (
                <Card key={product.id}>
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="400" blockAlign="center">
                      {product.productImage && (
                        <Thumbnail
                          source={product.productImage}
                          alt={product.productTitle}
                          size="medium"
                        />
                      )}
                      <BlockStack gap="100">
                        <Text as="p" variant="bodyLg" fontWeight="bold">
                          {product.productTitle}
                        </Text>
                        <InlineStack gap="200">
                          <Text as="p" variant="bodySm" tone="subdued">
                            {product.variants.length} variants
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {product.pdfs.length.toString()} PDFs attached
                          </Text>
                        </InlineStack>
                      </BlockStack>
                    </InlineStack>
                    
                    <Button onClick={() => handleProductClick(product.id)}>
                      View Variants
                    </Button>
                  </InlineStack>
                </Card>
              ))
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}