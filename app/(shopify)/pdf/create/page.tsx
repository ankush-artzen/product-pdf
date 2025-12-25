"use client";

import { useState } from "react";
import {
  Page,
  BlockStack,
  Toast,
  Frame,
  Box,
  ProgressBar,
  InlineStack,
  Text,
  Layout,
  Card,
  Thumbnail,
  Badge,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useRouter } from "next/navigation";
import { StepNavigation } from "../../../components/StepNavigation";
import { SummaryCard } from "../../../components/SummaryCard";
import { ProductSelectionStep } from "../../../components/ProductSelectionStep";
import { VariantSelectionStep } from "../../../components/VariantSelectionStep";
import { PDFUploadStep } from "../../../components/PDFUploadStep";
import { ReviewStep } from "../../../components/ReviewStep";

interface UploadedPDF {
  id: string;
  name: string;
  size: string;
  url: string;
  file?: File;
  uploadedAt: Date;
  variantId?: string;
}

interface Product {
  id: string;
  title: string;
  image?: string;
}

interface VariantOption {
  label: string;
  value: string;
  price?: string;
  inventory?: number;
}
import { useEffect } from "react";
const FALLBACK_IMAGE =
  "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";

export default function ProductPDFGenerator() {
  const app = useAppBridge();
  const router = useRouter();
  const [shop, setShop] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [availableVariants, setAvailableVariants] = useState<VariantOption[]>(
    []
  );
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  const [uploadedPDFs, setUploadedPDFs] = useState<UploadedPDF[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");
  const [toastError, setToastError] = useState(false);

  const showToast = (msg: string, isError = false) => {
    setToastContent(msg);
    setToastError(isError);
    setToastActive(true);
  };
  useEffect(() => {
    const shopFromConfig = (app as any)?.config?.shop;
    if (shopFromConfig) setShop(shopFromConfig);
    else setError("Unable to retrieve shop info. Please reload the app.");
  }, [app]);
  console.log("shopppppppp", shop);
  const dismissToast = () => setToastActive(false);

  // const selectProduct = async () => {
  //   const picker = await (app as any).resourcePicker({
  //     type: "product",
  //     multiple: false,
  //   });

  //   const product = picker?.selection?.[0];
  //   if (!product) return showToast("No product selected", true);

  //   setSelectedProduct({
  //     id: product.id,
  //     title: product.title,
  //     image: product.images?.[0]?.originalSrc || FALLBACK_IMAGE,
  //   });

  //   // Extract variant information
  //   const variantOptions: VariantOption[] = product.variants.map(
  //     (variant: any) => ({
  //       label: variant.title === "Default Title" ? "Default" : variant.title,
  //       value: variant.id,
  //       price: variant.price || "N/A",
  //       inventory: variant.inventoryQuantity || 0,
  //     })
  //   );

  //   setAvailableVariants(variantOptions);
  //   setSelectedVariantIds([]);

  //   showToast(
  //     `Product "${product.title}" selected with ${variantOptions.length} variants`
  //   );
  //   setStep(2);
  // };
  const selectProduct = async () => {
    const picker = await (app as any).resourcePicker({
      type: "product",
      multiple: false,
    });

    const product = picker?.selection?.[0];
    if (!product) return showToast("No product selected", true);

    // ⭐ Check if product already exists in DB
    const checkRes = await fetch("/api/product-pdfs/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });

    const checkData = await checkRes.json();

    if (checkData.exists) {
      // 🚫 PRODUCT ALREADY IN DB → BLOCK selection
      showToast(
        `Product "${product.title}" already has PDFs attached. You cannot select this.`,
        true
      );
      return;
    }

    // ⭐ Otherwise allow product selection
    setSelectedProduct({
      id: product.id,
      title: product.title,
      image: product.images?.[0]?.originalSrc || FALLBACK_IMAGE,
    });

    const variantOptions: VariantOption[] = product.variants.map(
      (variant: any) => ({
        label: variant.title === "Default Title" ? "Default" : variant.title,
        value: variant.id,
        price: variant.price || "N/A",
        inventory: variant.inventoryQuantity || 0,
      })
    );

    setAvailableVariants(variantOptions);
    setSelectedVariantIds([]);

    showToast(
      `Product "${product.title}" selected with ${variantOptions.length} variants`
    );

    setStep(2);
  };

  const handlePDFUpload = async () => {
    if (!selectedProduct)
      return showToast("Please select a product first", true);

    if (selectedVariantIds.length === 0) {
      return showToast("Please select at least one variant", true);
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.multiple = true;

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = Array.from(target.files || []) as File[];
      if (files.length === 0) return;

      if (files.length !== selectedVariantIds.length) {
        return showToast(
          `You selected ${selectedVariantIds.length} variants — please upload ${selectedVariantIds.length} PDF file(s)`,
          true
        );
      }

      setIsUploading(true);

      try {
        const mappedPDFs: UploadedPDF[] = files.map((file, i) => ({
          id: crypto.randomUUID(),
          name: file.name,
          size: formatFileSize(file.size),
          url: "",
          uploadedAt: new Date(),
          file,
          variantId: selectedVariantIds[i],
        }));

        setUploadedPDFs(mappedPDFs);
        showToast(
          `Uploaded ${mappedPDFs.length} PDF(s) and mapped to variants`
        );
      } catch {
        showToast("Error uploading files", true);
      } finally {
        setIsUploading(false);
      }
    };

    input.click();
  };

  const uploadPDFsToServer = async (productId: string) => {
    const formData = new FormData();

    // ✅ ADD THIS
    if (!shop) {
      showToast("Shop not found. Reload app.", true);
      return;
    }
    formData.append("shop", shop);

    formData.append("productId", productId);
    formData.append("productTitle", selectedProduct?.title || "");
    formData.append("productImage", selectedProduct?.image || FALLBACK_IMAGE);

    const variantMappings: any[] = [];

    uploadedPDFs.forEach((pdf) => {
      if (!pdf.file || !pdf.variantId) return;

      formData.append("pdfs", pdf.file);

      const variantInfo = availableVariants.find(
        (v) => v.value === pdf.variantId
      );
      variantMappings.push({
        variantId: pdf.variantId,
        variantTitle: variantInfo?.label || "",
        variantPrice: variantInfo?.price || "",
      });
    });

    formData.append("variantData", JSON.stringify(variantMappings));
    formData.append("allVariants", JSON.stringify(availableVariants));

    const res = await fetch("/api/product-pdfs/upload", {
      method: "POST",
      body: formData,
    });

    return await res.json();
  };

  const removePDF = (pdfId: string) => {
    setUploadedPDFs((prev) => prev.filter((p) => p.id !== pdfId));
    showToast("PDF removed");
  };

  const clearAllPDFs = () => {
    setUploadedPDFs([]);
    showToast("All PDFs removed");
  };

  const viewPDF = (pdfUrl: string) => window.open(pdfUrl, "_blank");

  const savePDFs = async () => {
    if (!selectedProduct) return showToast("Select a product first", true);
    if (uploadedPDFs.length === 0)
      return showToast("Upload at least one PDF", true);

    const hasMissingVariantIds = uploadedPDFs.some((pdf) => !pdf.variantId);
    if (hasMissingVariantIds) {
      return showToast("Some PDFs are not properly mapped to variants", true);
    }

    setIsUploading(true);
    try {
      const result = await uploadPDFsToServer(selectedProduct.id);

      if (result.exists) {
        showToast(
          "PDFs already exist for this product/variant combination!",
          true
        );
        return;
      }

      if (result.success) {
        showToast("PDFs saved successfully!");
        router.push("/pdf");
        return;
      }

      if (result.error) {
        showToast(result.error, true);
        return;
      }
    } catch {
      showToast("Error saving PDFs", true);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const progress = ((step - 1) / 2) * 100;

  return (
    <Frame>
      {toastActive && (
        <Toast
          content={toastContent}
          error={toastError}
          onDismiss={dismissToast}
        />
      )}

      <Page
        title="Product PDF Manager"
        subtitle="Attach PDF files to your products"
        fullWidth
        primaryAction={{
          content: "Save PDFs",
          onAction: savePDFs,
          disabled: uploadedPDFs.length === 0 || !selectedProduct,
          loading: isUploading,
        }}
      >
        <Layout>
          {selectedProduct && (
            <Layout.Section variant="fullWidth">
              <Card padding="400" background="bg-surface-secondary">
                <InlineStack align="start" gap="400" blockAlign="center">
                  <Thumbnail
                    size="medium"
                    source={selectedProduct?.image || "fallbackImage"}
                    alt={selectedProduct?.title || ""}
                  />
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyLg" fontWeight="semibold">
                      {selectedProduct?.title}
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
              </Card>
            </Layout.Section>
          )}

          <Layout.Section>
            <Box paddingBlockEnd="400">
              <BlockStack gap="200">
                <Text
                  as="p"
                  variant="bodySm"
                  tone="subdued"
                  fontWeight="medium"
                >
                  Step {step} of 2
                </Text>
                <ProgressBar progress={progress} size="small" />
              </BlockStack>
            </Box>
            <Box width="100%">
              <BlockStack gap="600">
                {step === 1 && (
                  <ProductSelectionStep
                    selectedProduct={selectedProduct}
                    onSelectProduct={selectProduct}
                    onClearProduct={() => {
                      setSelectedProduct(null);
                      setUploadedPDFs([]);
                      setAvailableVariants([]);
                      setSelectedVariantIds([]);
                    }}
                    variantCount={availableVariants.length}
                    onContinue={() => setStep(2)}
                    fallbackImage={FALLBACK_IMAGE}
                  />
                )}
                {/* 
                {step === 2 && selectedProduct && (
                  <VariantSelectionStep
                    product={selectedProduct}
                    availableVariants={availableVariants}
                    selectedVariantIds={selectedVariantIds}
                    isLoading={isLoadingVariants}
                    // onVariantToggle={(variantId) => {
                    //   if (selectedVariantIds.includes(variantId)) {
                    //     setSelectedVariantIds(
                    //       selectedVariantIds.filter((id) => id !== variantId)
                    //     );
                    //   } else {
                    //     setSelectedVariantIds([...selectedVariantIds, variantId]);
                    //   }
                    // }}
                    onVariantToggle={(variantId) => {
                      setSelectedVariantIds([variantId]);
                    }}
                    onSelectAll={() => {
                      setSelectedVariantIds(
                        availableVariants.map((v) => v.value)
                      );
                    }}
                    onDeselectAll={() => setSelectedVariantIds([])}
                    onBack={() => setStep(1)}
                    onContinue={() => {
                      if (selectedVariantIds.length === 0) {
                        showToast("Please select at least one variant", true);
                      } else {
                        setStep(3);
                      }
                    }}
                    fallbackImage={FALLBACK_IMAGE}
                  />
                )} */}
                {step === 2 && selectedProduct && (
                  <VariantSelectionStep
                    product={selectedProduct}
                    availableVariants={availableVariants}
                    selectedVariantIds={selectedVariantIds}
                    isLoading={isLoadingVariants}
                    onVariantToggle={(variantId) => {
                      setSelectedVariantIds([variantId]);
                    }}
                    onSave={savePDFs}
                    onSelectAll={() => {
                      setSelectedVariantIds(
                        availableVariants.map((v) => v.value)
                      );
                    }}
                    onDeselectAll={() => setSelectedVariantIds([])}
                    uploadedPDFs={uploadedPDFs}
                    isUploading={isUploading}
                    onUploadPDF={handlePDFUpload}
                    onRemovePDF={removePDF}
                    onClearAllPDFs={clearAllPDFs}
                    onBack={() => setStep(1)}
                    onContinue={() => {
                      if (uploadedPDFs.length === 0) {
                        showToast("Please upload at least one PDF", true);
                      }
                    }}
                    fallbackImage={FALLBACK_IMAGE}
                  />
                )}

                {/* {step === 3 && (
                  <PDFUploadStep
                    uploadedPDFs={uploadedPDFs}
                    availableVariants={availableVariants}
                    isUploading={isUploading}
                    onUpload={handlePDFUpload}
                    onRemove={removePDF}
                    onClearAll={clearAllPDFs}
                    onBack={() => setStep(2)}
                    onContinue={() => setStep(4)}
                  />
                )} */}

                {/* {uploadedPDFs.length > 0 && (
                  <ReviewStep
                    product={selectedProduct}
                    selectedVariantIds={selectedVariantIds}
                    availableVariants={availableVariants}
                    uploadedPDFs={uploadedPDFs}
                    isUploading={isUploading}
                    onBack={() => {}}
                    onSave={savePDFs}
                    fallbackImage={FALLBACK_IMAGE}
                  />
                )} */}

                {/* 

                {step === 4 && selectedProduct && (
                  <ReviewStep
                    product={selectedProduct}
                    selectedVariantIds={selectedVariantIds}
                    availableVariants={availableVariants}
                    uploadedPDFs={uploadedPDFs}
                    isUploading={isUploading}
                    onBack={() => setStep(3)}
                    onSave={savePDFs}
                    fallbackImage={FALLBACK_IMAGE}
                  />
                )} */}
              </BlockStack>
            </Box>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <StepNavigation
                currentStep={step}
                // steps={[
                //   {
                //     number: 1,
                //     title: "Select Product",
                //     description: "Choose your product",
                //     enabled: true,
                //     onClick: () => setStep(1),
                //   },
                //   {
                //     number: 2,
                //     title: "Select Variants",
                //     description: "Choose product variants",
                //     enabled: !!selectedProduct,
                //     onClick: () => selectedProduct && setStep(2),
                //   },
                //   {
                //     number: 3,
                //     title: "Upload PDFs",
                //     description: "Add your PDF files",
                //     enabled: uploadedPDFs.length > 0,
                //     onClick: () => uploadedPDFs.length > 0 && setStep(3),
                //   },
                //   {
                //     number: 4,
                //     title: "Review & Save",
                //     description: "Finalize your setup",
                //     enabled: uploadedPDFs.length > 0,
                //     onClick: () => uploadedPDFs.length > 0 && setStep(4),
                //   },
                // ]}
                steps={[
                  {
                    number: 1,
                    title: "Select Product",
                    description: "Choose your product",
                    enabled: true,
                    onClick: () => setStep(1),
                  },
                  {
                    number: 2,
                    title: "Variants & PDFs",
                    description: "Attach PDFs and review",
                    enabled: !!selectedProduct,
                    onClick: () => selectedProduct && setStep(2),
                  },
                ]}
              />

              <SummaryCard
                productTitle={selectedProduct?.title}
                selectedVariantCount={selectedVariantIds.length}
                totalVariantCount={availableVariants.length}
                uploadedPDFCount={uploadedPDFs.length}
                currentStep={step}
              />
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
function setError(arg0: string) {
  throw new Error("Function not implemented.");
}
