"use client";

import { useEffect, useState, useRef } from "react";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Spinner,
  Box,
  Icon,
  Button,
  Divider,
  Modal,
  TextField,
  Banner,
  Select,
  Layout,
  RadioButton,
  InlineGrid,
} from "@shopify/polaris";
import {
  ViewIcon,
  SaveIcon,
  UploadIcon,
  DeleteIcon,
  ArrowLeftIcon,
} from "@shopify/polaris-icons";
import { useRouter, useParams } from "next/navigation";
import { VariantListSection } from "./components/VariantListSection";
import { PDFUploadSection } from "./components/PDFUploadSection";
import { ReviewModal } from "./components/ReviewModal";
import { useAppBridge } from "@shopify/app-bridge-react";

interface PDF {
  id: string;
  name: string;
  size: string;
  url: string;
  path: string;
  uploadedAt: string;
  variantId?: string;
  variantTitle?: string;
  variantPrice?: string;
  productId: string;
  productTitle?: string;
  productImage?: string;
  productPrice?: string;
}

interface Variant {
  variantId: string;
  variantTitle: string;
  variantPrice?: string;
  hasPdf: boolean;
  inventory?: number;
  sku?: string;
}

interface ProductWithVariants {
  id: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  productPrice?: string;
  variants: Variant[];
  pdfs: PDF[];
}

interface UploadedPDF {
  id: string;
  name: string;
  size: string;
  file: File;
  variantId: string;
  variantTitle?: string;
}

export default function EditPDFPage() {
  const app = useAppBridge();

  const router = useRouter();
  const params = useParams();
  const pdfId = params?.id as string;

  const [shop, setShop] = useState<string | null>(null);
  const [pdf, setPdf] = useState<PDF | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [productVariants, setProductVariants] = useState<Variant[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithVariants | null>(null);
  const [uploadedPDFs, setUploadedPDFs] = useState<UploadedPDF[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<PDF[]>([]);
  const [variantsWithPdfs, setVariantsWithPdfs] = useState<Variant[]>([]);
  const [variantsWithoutPdfs, setVariantsWithoutPdfs] = useState<Variant[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pdfsToReplace, setPdfsToReplace] = useState<PDF[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [replaceConfirmModalOpen, setReplaceConfirmModalOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<UploadedPDF | null>(null);
  useEffect(() => {
    try {
      const shopFromConfig = (app as any)?.config?.shop;
      if (shopFromConfig) setShop(shopFromConfig);
      else setError("Unable to retrieve shop info. Please reload the app.");
    } catch {
      setError("Unable to retrieve shop info. Please reload the app.");
    }
  }, [app]);

  const fetchPDFDetails = async () => {
    if (!pdfId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/product-pdfs/details`);
      const result = await response.json();

      if (result.success && result.products) {
        let foundPdf: PDF | null = null;
        let productWithVariants: ProductWithVariants | null = null;

        // Find the PDF and its product
        for (const product of result.products) {
          const pdfInProduct = product.pdfs.find((p: PDF) => p.id === pdfId);
          if (pdfInProduct) {
            foundPdf = pdfInProduct;
            productWithVariants = product;
            break;
          }
        }

        if (foundPdf && productWithVariants) {
          setPdf(foundPdf);
          setPdfName(foundPdf.name);
          setSelectedVariant(foundPdf.variantId || "");
          setSelectedProduct(productWithVariants);
          setProductVariants(productWithVariants.variants);
          setExistingAttachments(productWithVariants.pdfs);

          // Categorize variants
          const withPdfs: Variant[] = [];
          const withoutPdfs: Variant[] = [];

          productWithVariants.variants.forEach((variant) => {
            const hasPdf = productWithVariants.pdfs.some(
              (pdf) => pdf.variantId === variant.variantId
            );

            if (hasPdf) {
              withPdfs.push({ ...variant, hasPdf: true });
            } else {
              withoutPdfs.push({ ...variant, hasPdf: false });
            }
          });

          setVariantsWithPdfs(withPdfs);
          setVariantsWithoutPdfs(withoutPdfs);
        } else {
          setError("PDF not found in any product");
        }
      } else {
        setError(result.error || "Failed to load PDF details");
      }
    } catch (err) {
      setError("Error loading PDF details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pdfId) {
      fetchPDFDetails();
    }
  }, [pdfId]);

  // Get variant options for select dropdown
  const getVariantOptions = () => {
    if (!pdf || productVariants.length === 0) {
      return [{ value: "", label: "Loading variants..." }];
    }

    const options = [{ value: "", label: "Select Product variant" }];

    // Add variants without PDFs
    variantsWithoutPdfs.forEach((variant) => {
      options.push({
        value: variant.variantId,
        label: `${variant.variantTitle}${variant.variantPrice ? ` - ₹${variant.variantPrice}` : ""}`,
      });
    });

    // Add current variant if it exists and isn't already in the list
    if (pdf.variantId) {
      const currentVariant = productVariants.find(
        (v) => v.variantId === pdf.variantId
      );
      if (
        currentVariant &&
        !variantsWithoutPdfs.some((v) => v.variantId === pdf.variantId)
      ) {
        options.push({
          value: pdf.variantId,
          label: `${currentVariant.variantTitle}${currentVariant.variantPrice ? ` - ₹${currentVariant.variantPrice}` : ""} (Current)`,
        });
      }
    }

    if (options.length === 1) {
      return [{ value: "", label: "All variants already have PDFs assigned" }];
    }

    return options;
  };

  // Handle PDF file upload for bulk uploads
  const handlePDFUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file only");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    // Check if variant is selected
    if (!selectedVariant) {
      setError("Please select a variant first");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Check if this variant already has an uploaded PDF
    const existingUpload = uploadedPDFs.find(
      (pdf) => pdf.variantId === selectedVariant
    );
    if (existingUpload) {
      setError(
        `Variant already has a PDF uploaded. Please remove "${existingUpload.name}" first or select a different variant.`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Check if this variant already has an existing PDF in database
    const existingAttachment = existingAttachments.find(
      (att) => att.variantId === selectedVariant
    );

    // Get variant details
    const variantDetails = productVariants.find(
      (v) => v.variantId === selectedVariant
    );

    const newPdfId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newPDF: UploadedPDF = {
      id: newPdfId,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      file: file,
      variantId: selectedVariant,
      variantTitle: variantDetails?.variantTitle,
    };

    // If there's an existing attachment, show confirmation modal
    if (existingAttachment) {
      setPendingUpload(newPDF);
      setReplaceConfirmModalOpen(true);
    } else {
      setUploadedPDFs((prev) => [...prev, newPDF]);
      setError("");
      setSuccess(
        `PDF "${file.name}" added for ${variantDetails?.variantTitle}`
      );
      setTimeout(() => setSuccess(""), 3000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle replacement confirmation for bulk uploads
  const handleReplaceConfirmation = (confirmed: boolean) => {
    if (confirmed && pendingUpload) {
      // Remove any existing uploaded PDF for this variant
      setUploadedPDFs((prev) =>
        prev.filter((pdf) => pdf.variantId !== pendingUpload.variantId)
      );

      // Add the new PDF
      setUploadedPDFs((prev) => [...prev, pendingUpload]);

      // Track PDFs to be replaced
      const pdfToReplace = existingAttachments.find(
        (att) => att.variantId === pendingUpload.variantId
      );
      if (pdfToReplace) {
        setPdfsToReplace((prev) => [
          ...prev.filter((p) => p.id !== pdfToReplace.id),
          pdfToReplace,
        ]);
      }

      setSuccess(
        `PDF "${pendingUpload.name}" will replace existing PDF for this variant`
      );
      setTimeout(() => setSuccess(""), 3000);
    }

    setReplaceConfirmModalOpen(false);
    setPendingUpload(null);
  };

  // Remove uploaded PDF from bulk uploads
  const removePDF = (pdfId: string) => {
    const pdfToRemove = uploadedPDFs.find((pdf) => pdf.id === pdfId);
    if (pdfToRemove) {
      // Remove from pdfsToReplace if it was replacing an existing PDF
      const wasReplacing = existingAttachments.find(
        (att) => att.variantId === pdfToRemove.variantId
      );
      if (wasReplacing) {
        setPdfsToReplace((prev) =>
          prev.filter((p) => p.variantId !== pdfToRemove.variantId)
        );
      }
    }

    setUploadedPDFs((prev) => prev.filter((pdf) => pdf.id !== pdfId));
  };

  // Clear all uploaded PDFs from bulk uploads
  const clearAllPDFs = () => {
    setUploadedPDFs([]);
    setPdfsToReplace([]);
  };

  // Handle bulk upload and save
  const handleUploadAndSave = async () => {
    if (uploadedPDFs.length === 0) {
      setError("Please upload at least one PDF file");
      return;
    }

    // Show review modal before final save
    // setShowReviewModal(true);
    await handleFinalSave();

  };

  // Final save for bulk uploads
  const handleFinalSave = async () => {
    if (!selectedProduct?.id) {
      setError("Cannot find product record. Please refresh the page.");
      return;
    }

    if (uploadedPDFs.length === 0) {
      setError("No PDFs to upload");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      // Separate PDFs into replacements and new uploads
      const replacementPDFs: UploadedPDF[] = [];
      const newPDFs: UploadedPDF[] = [];

      uploadedPDFs.forEach((uploadedPdf) => {
        const isReplacement = pdfsToReplace.some(
          (replacePdf) => replacePdf.variantId === uploadedPdf.variantId
        );
        if (isReplacement) {
          replacementPDFs.push(uploadedPdf);
        } else {
          newPDFs.push(uploadedPdf);
        }
      });

      console.log("Processing:", {
        total: uploadedPDFs.length,
        replacements: replacementPDFs.length,
        newUploads: newPDFs.length,
      });

      let allSuccessful = true;
      let errorMessage = "";

      // Handle replacements using UPDATE API
      for (const uploadedPdf of replacementPDFs) {
        if (!uploadedPdf.file) {
          allSuccessful = false;
          errorMessage = `Please re-upload the PDF file for variant "${uploadedPdf.variantTitle}".`;
          break;
        }

        const pdfToReplace = pdfsToReplace.find(
          (p) => p.variantId === uploadedPdf.variantId
        );

        if (!pdfToReplace) continue;

        const variantInfo = productVariants.find(
          (v) => v.variantId === uploadedPdf.variantId
        );

        const formData = new FormData();
        formData.append("pdfId", pdfToReplace.id);
        formData.append("name", uploadedPdf.name);
        formData.append("variantId", uploadedPdf.variantId);
        formData.append("variantTitle", variantInfo?.variantTitle || "");
        formData.append("variantPrice", variantInfo?.variantPrice || "");
        formData.append("pdf", uploadedPdf.file);
        console.log("formData-----------", formData);

        formData.append(
          "allVariants",
          JSON.stringify(
            productVariants.map((v) => ({
              value: v.variantId,
              label: v.variantTitle,
              price: v.variantPrice || "",
            }))
          )
        );

        const response = await fetch(
          `/api/product-pdfs/${selectedProduct.id}/update`,
          { method: "PUT", body: formData }
        );

        const result = await response.json();

        if (!result.success) {
          allSuccessful = false;
          errorMessage = result.message || "PDF replacement failed";
          break;
        }
      }

      // Handle new uploads using CREATE API
      if (allSuccessful && newPDFs.length > 0) {
        // Prepare data for create API
        const variantMappings: any[] = newPDFs.map((uploadedPdf) => {
          const variantInfo = productVariants.find(
            (v) => v.variantId === uploadedPdf.variantId
          );
          return {
            variantId: uploadedPdf.variantId,
            variantTitle:
              variantInfo?.variantTitle || uploadedPdf.variantTitle || "",
            variantPrice: variantInfo?.variantPrice || "",
          };
        });

        const createFormData = new FormData();
        createFormData.append("shop", shop ?? "");

        createFormData.append("productId", selectedProduct.productId);
        createFormData.append(
          "productTitle",
          selectedProduct.productTitle || ""
        );
        createFormData.append(
          "productImage",
          selectedProduct.productImage || ""
        );

        // Add all PDF files
        newPDFs.forEach((uploadedPdf) => {
          createFormData.append("pdfs", uploadedPdf.file);
        });

        // Add variant data
        createFormData.append("variantData", JSON.stringify(variantMappings));

        // Add all variants for reference
        if (productVariants.length > 0) {
          createFormData.append(
            "allVariants",
            JSON.stringify(
              productVariants.map((v) => ({
                value: v.variantId,
                label: v.variantTitle,
                price: v.variantPrice || "",
              }))
            )
          );
        }

        try {
          const response = await fetch(`/api/product-pdfs/upload`, {
            method: "POST",
            body: createFormData,
          });

          const result = await response.json();

          if (!result.success) {
            allSuccessful = false;
            errorMessage = result.message || "Failed to upload new PDFs";
          }
        } catch (err) {
          allSuccessful = false;
          errorMessage = `Error uploading new PDFs: ${(err as Error).message}`;
        }
      }

      if (allSuccessful) {
        const totalProcessed = replacementPDFs.length + newPDFs.length;
        const actions = [];
        if (replacementPDFs.length > 0)
          actions.push(`${replacementPDFs.length} replaced`);
        if (newPDFs.length > 0) actions.push(`${newPDFs.length} new`);

        setSuccess(
          `${totalProcessed} PDF(s) processed successfully (${actions.join(", ")})!`
        );
        setUploadedPDFs([]);
        setPdfsToReplace([]);
        setShowReviewModal(false);
        setTimeout(() => {
          router.replace("/pdf");
        });
        // Refresh data
        await fetchPDFDetails();

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(errorMessage);
        setShowReviewModal(false);
      }
    } catch (err) {
      setError("Error processing PDFs");
      setShowReviewModal(false);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Handle single PDF save (for the main PDF being edited)
  // const handleSave = async () => {
  //   if (!pdf || !pdfName.trim()) {
  //     setError("PDF name is required");
  //     return;
  //   }

  //   if (pdfName.trim().length > 100) {
  //     setError("PDF name must be less than 100 characters");
  //     return;
  //   }

  //   // Check if we have the ProductPDF ID
  //   if (!selectedProduct?.id) {
  //     setError("Cannot find product record. Please refresh the page.");
  //     return;
  //   }

  //   try {
  //     setSaving(true);
  //     setError("");
  //     setSuccess("");

  //     const selectedVariantDetails = productVariants.find(
  //       (v) => v.variantId === selectedVariant
  //     );

  //     const formData = new FormData();
  //     formData.append("pdfId", shop); // Individual PDF ID

  //     formData.append("pdfId", pdf.id); // Individual PDF ID
  //     formData.append("name", pdfName.trim());
  //     formData.append("variantId", selectedVariant || "");
  //     formData.append(
  //       "variantTitle",
  //       selectedVariantDetails?.variantTitle || ""
  //     );
  //     formData.append(
  //       "variantPrice",
  //       selectedVariantDetails?.variantPrice || ""
  //     );

  //     // Include all variants for backend sync
  //     if (productVariants.length > 0) {
  //       formData.append(
  //         "allVariants",
  //         JSON.stringify(
  //           productVariants.map((v) => ({
  //             value: v.variantId,
  //             label: v.variantTitle,
  //             price: v.variantPrice || "",
  //           }))
  //         )
  //       );
  //     }

  //     // Check if there's a new file to upload
  //     const fileInput = fileInputRef.current;
  //     const hasNewFile = fileInput?.files && fileInput.files.length > 0;

  //     if (hasNewFile && fileInput?.files) {
  //       const newFile = fileInput.files[0];
  //       formData.append("pdf", newFile);
  //     }

  //     // Use the UPDATE API with ProductPDF ID
  //     const response = await fetch(
  //       `/api/product-pdfs/${selectedProduct.id}/update`,
  //       {
  //         method: "PUT",
  //         body: formData,
  //       }
  //     );

  //     const result = await response.json();

  //     if (result.success) {
  //       setSuccess("PDF saved successfully!");

  //       await fetchPDFDetails();

  //       setTimeout(() => {
  //         router.push("/pdf");
  //       }, 1500);
  //     } else {
  //       setError(result.message || result.error || "Failed to save PDF");
  //     }
  //   } catch (err) {
  //     setError("Error saving PDF: " + (err as Error).message);
  //     console.error(err);
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const handleDelete = async () => {
    if (!pdf) return;

    try {
      setSaving(true);
      const response = await fetch("/api/product-pdfs/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfId: pdf.id,
          pdfUrl: pdf.url,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/pdf");
      } else {
        setError("Failed to delete PDF");
        setDeleteModalOpen(false);
      }
    } catch (err) {
      setError("Error deleting PDF");
    } finally {
      setSaving(false);
    }
  };

  const viewPDF = () => {
    if (pdf?.url) {
      window.open(pdf.url, "_blank");
    }
  };

  const downloadPDF = () => {
    if (pdf?.url) {
      const link = document.createElement("a");
      link.href = pdf.url;
      link.download = pdf.name;
      link.click();
    }
  };

  if (loading) {
    return (
      <Page
        title="Edit PDF"
        backAction={{
          content: "Back to Library",
          onAction: () => router.push("/pdf"),
        }}
      >
        <Box padding="800">
          <InlineStack gap="400" align="center" blockAlign="center">
            <Spinner size="large" />
            <BlockStack gap="100">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Loading PDF Details
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Fetching PDF information...
              </Text>
            </BlockStack>
          </InlineStack>
        </Box>
      </Page>
    );
  }

  if (!pdf) {
    return (
      <Page
        title="Edit PDF"
        backAction={{
          content: "Back to Library",
          onAction: () => router.push("/pdf"),
        }}
      >
        <Box padding="800">
          <BlockStack gap="400" align="center">
            <Banner tone="critical">
              <Text as="p" variant="bodyMd">
                PDF not found. It may have been deleted or the ID is invalid.
              </Text>
            </Banner>
            <Button onClick={() => router.push("/pdf")} icon={ArrowLeftIcon}>
              Back to PDF Library
            </Button>
          </BlockStack>
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Edit PDF"
      backAction={{
        content: "Back to Library",
        onAction: () => router.push("/pdf"),
      }}
      // primaryAction={{
      //   content: "Save Changes",
      //   icon: SaveIcon,
      //   onAction: handleSave,
      //   loading: saving,
      //   disabled: !pdfName.trim(),
      // }}
      secondaryActions={[
        {
          content: "Preview PDF",
          icon: ViewIcon,
          onAction: () => setPreviewModalOpen(true),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                {error && (
                  <Banner tone="critical">
                    <Text as="p" variant="bodyMd">
                      {error}
                    </Text>
                  </Banner>
                )}

                {success && (
                  <Banner tone="success">
                    <Text as="p" variant="bodyMd">
                      {success}
                    </Text>
                  </Banner>
                )}

                {/* <TextField
                  label="PDF Name"
                  value={pdfName}
                  onChange={setPdfName}
                  autoComplete="off"
                  error={!pdfName.trim() ? "PDF name is required" : undefined}
                  helpText={`${pdfName.length}/100 characters`}
                  maxLength={100}
                  showCharacterCount
                /> */}

                {/* <Select
                  label="Assign to Variant"
                  options={getVariantOptions()}
                  value={selectedVariant}
                  onChange={setSelectedVariant}
                  helpText={
                    selectedVariant === ""
                      ? "PDF will be available for all variants of this product"
                      : "PDF will be assigned to this specific variant"
                  }
                  disabled={productVariants.length === 0}
                /> */}
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd" fontWeight="bold">
                      Select Variant
                    </Text>

                    <InlineGrid gap="200" columns={3}>
                      {productVariants.map((variant) => {
                        const isSelected =
                          selectedVariant === variant.variantId;

                        const hasExistingPdf = existingAttachments.some(
                          (pdf) => pdf.variantId === variant.variantId
                        );

                        return (
                          <Card
                            key={variant.variantId}
                            padding="300"
                            background={
                              isSelected ? "bg-surface-success" : "bg-surface"
                            }
                          >
                            <BlockStack gap="200">
                              {/* Variant title */}
                              <Text as="p" variant="bodyMd" fontWeight="medium">
                                {variant.variantTitle}
                              </Text>

                              {/* Status badge */}
                              {hasExistingPdf ? (
                                <Badge tone="critical">PDF Exists</Badge>
                              ) : isSelected ? (
                                <Badge tone="success">Selected</Badge>
                              ) : (
                                <Badge tone="info">Available</Badge>
                              )}

                              {/* Radio button */}
                              <RadioButton
                                label="Attach PDF to this variant"
                                checked={isSelected}
                                // disabled={hasExistingPdf}
                                disabled={false}
                                name="variant-selection"
                                onChange={() =>
                                  setSelectedVariant(variant.variantId)
                                }
                              />
                            </BlockStack>
                          </Card>
                        );
                      })}
                    </InlineGrid>

                    {!selectedVariant && (
                      <Text as="p" tone="subdued" variant="bodySm">
                        Select exactly one variant to attach the PDF
                      </Text>
                    )}
                  </BlockStack>
                </Card>

                <Divider />

                <PDFUploadSection
                  uploadedPDFs={uploadedPDFs}
                  productVariants={productVariants}
                  existingAttachments={existingAttachments}
                  selectedVariant={selectedVariant}
                  isUploading={uploading}
                  fileInputRef={fileInputRef}
                  onUpload={handlePDFUpload}
                  onRemove={removePDF}
                  onClearAll={clearAllPDFs}
                  onFileChange={handleFileChange}
                  onReviewAndSave={handleUploadAndSave}
                />

                <Divider />

                {/* Variants Summary Section */}
                {/* <Card>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd" fontWeight="bold">
                      Variants Summary
                    </Text>
                    
                    <VariantListSection
                      title="Variants with PDFs"
                      description="These variants already have PDF attachments"
                      variants={variantsWithPdfs}
                      existingAttachments={existingAttachments}
                      badgeTone="success"
                      badgeText="PDF Already Added"
                      emptyMessage="No variants have PDFs assigned yet"
                      showPdfName={true}
                    />

                    <Divider />

                    <VariantListSection
                      title="Product Variants Without PDFs"
                      description="These variants are still not attached to any PDF"
                      variants={variantsWithoutPdfs}
                      badgeTone="info"
                      badgeText="Available for PDF"
                      emptyMessage="All variants already have PDFs assigned"
                    />
                  </BlockStack>
                </Card> */}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      {/* PDF Preview Modal */}
      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="PDF Preview"
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd" fontWeight="bold">
              {pdf.name}
            </Text>
            <Box
              background="bg-surface-secondary"
              padding="800"
              borderRadius="300"
            >
              <iframe
                src={pdf.url}
                style={{
                  width: "100%",
                  height: "500px",
                  border: "none",
                  borderRadius: "8px",
                }}
                title="PDF Preview"
              />
            </Box>
            <InlineStack align="end">
              <Button onClick={downloadPDF} variant="primary">
                Download PDF
              </Button>
            </InlineStack>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete PDF File"
        primaryAction={{
          content: "Delete PDF",
          onAction: handleDelete,
          loading: saving,
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
            <Banner tone="critical">
              <Text as="p" variant="bodyMd">
                This action cannot be undone. The PDF file will be permanently
                removed from the product.
              </Text>
            </Banner>

            <Card background="bg-surface-secondary" padding="400">
              <BlockStack gap="300">
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  PDF to delete:
                </Text>
                <InlineStack gap="300" blockAlign="center">
                  <Icon source={ViewIcon} tone="base" />
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      {pdf.name}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {pdf.size} • Uploaded{" "}
                      {new Date(pdf.uploadedAt).toLocaleDateString()}
                    </Text>
                    {pdf.variantTitle && (
                      <Text as="p" variant="bodySm" tone="success">
                        Variant: {pdf.variantTitle}
                      </Text>
                    )}
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Replace Confirmation Modal */}
      <Modal
        open={replaceConfirmModalOpen}
        onClose={() => handleReplaceConfirmation(false)}
        title="Replace Existing PDF"
        primaryAction={{
          content: "Replace PDF",
          onAction: () => handleReplaceConfirmation(true),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => handleReplaceConfirmation(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Banner tone="warning">
              <Text as="p" variant="bodyMd">
                This variant already has a PDF attached. The new PDF will
                replace the existing one.
              </Text>
            </Banner>

            {pendingUpload && (
              <Card background="bg-surface-secondary" padding="400">
                <BlockStack gap="300">
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    Replacement Details:
                  </Text>

                  <BlockStack gap="200">
                    {/* Existing PDF */}
                    <Card>
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={DeleteIcon} tone="critical" />
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" fontWeight="bold">
                            Current PDF (Will be replaced):
                          </Text>
                          {existingAttachments.map((att) => {
                            if (att.variantId === pendingUpload.variantId) {
                              return (
                                <InlineStack key={att.id} gap="100">
                                  <Text as="p" variant="bodySm">
                                    {att.name}
                                  </Text>
                                  <Badge tone="critical">{att.size}</Badge>
                                </InlineStack>
                              );
                            }
                            return null;
                          })}
                        </BlockStack>
                      </InlineStack>
                    </Card>

                    {/* New PDF */}
                    <Card>
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={UploadIcon} tone="success" />
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" fontWeight="bold">
                            New PDF:
                          </Text>
                          <InlineStack gap="100">
                            <Text as="p" variant="bodySm">
                              {pendingUpload.name}
                            </Text>
                            <Badge tone="success">{pendingUpload.size}</Badge>
                          </InlineStack>
                        </BlockStack>
                      </InlineStack>
                    </Card>
                  </BlockStack>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      <ReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSave={handleFinalSave}
        uploading={uploading}
        selectedProduct={selectedProduct}
        productVariants={productVariants}
        existingAttachments={existingAttachments}
        uploadedPDFs={uploadedPDFs}
        pdfsToReplace={pdfsToReplace}
      />
    </Page>
  );
}
