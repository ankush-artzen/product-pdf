// "use client";

// import { useState, useEffect } from "react";
// import {
//   Page,
//   Card,
//   Text,
//   Button,
//   InlineStack,
//   BlockStack,
//   Box,
//   Icon,
//   Badge,
//   ProgressBar,
//   Layout,
//   Link,
//   Banner,
//   List,
//   Thumbnail,
// } from "@shopify/polaris";
// import {
//   PlusIcon,
//   ArrowUpIcon,
//   ClockIcon,
//   CheckCircleIcon,
// } from "@shopify/polaris-icons";

// interface Stats {
//   totalProducts: number;
//   totalPDFs: number;
//   totalSize: string;
//   recentUploads: number;
// }

// interface RecentActivity {
//   id: string;
//   productName: string;
//   action: string;
//   pdfName: string;
//   timestamp: string;
//   type: "upload" | "delete" | "update";
// }

// export default function PDFManagerHomePage() {
//   return (
//     <Page
//       title="Product PDF Manager Dashboard"
//       subtitle="Manage and organize PDF files for your products"
//       // primaryAction={{
//       //   content: "Manage PDFs",
//       //   url: "/product-pdfs",
//       // }}
//       // secondaryActions={[
//       //   {
//       //     content: "Quick Upload",
//       //     icon: PlusIcon,
//       //     url: "/product-pdfs?upload=true",
//       //   },
//       // ]}
//     >
//       {/* Welcome Banner */}
//       <Box paddingBlockEnd="400">
//         <Banner title="Welcome to Product PDF Manager" tone="info">
//           <Text as="p" variant="bodyMd">
//             Easily attach, manage, and organize PDF files for your products.
//             Upload manuals, specifications, and documentation in one place.
//           </Text>
//         </Banner>
//       </Box>

//       <Layout>
//         {/* Bottom Section - Tips & Getting Started */}
//         <Layout.Section>
//           <Card>
//             <BlockStack gap="400">
//               <Text as="p" variant="headingMd" fontWeight="bold">
//                 Getting Started
//               </Text>
//               <BlockStack gap="300">
//                 <InlineStack gap="300" blockAlign="start">
//                   <Box
//                     background="bg-surface-brand"
//                     padding="200"
//                     borderRadius="200"
//                   >
//                     <Text
//                       as="p"
//                       variant="bodySm"
//                       fontWeight="bold"
//                       tone="subdued"
//                     >
//                       1
//                     </Text>
//                   </Box>
//                   <BlockStack gap="100">
//                     <Text as="p" variant="bodyMd" fontWeight="medium">
//                       Select a Product
//                     </Text>
//                     <Text as="p" variant="bodySm" tone="subdued">
//                       Choose which product you want to attach PDF files to
//                     </Text>
//                   </BlockStack>
//                 </InlineStack>

//                 <InlineStack gap="300" blockAlign="start">
//                   <Box
//                     background="bg-surface-success"
//                     padding="200"
//                     borderRadius="200"
//                   >
//                     <Text
//                       as="p"
//                       variant="bodySm"
//                       fontWeight="bold"
//                       tone="success"
//                     >
//                       2
//                     </Text>
//                   </Box>
//                   <BlockStack gap="100">
//                     <Text as="p" variant="bodyMd" fontWeight="medium">
//                       Upload PDF Files
//                     </Text>
//                     <Text as="p" variant="bodySm" tone="subdued">
//                       Add manuals, specifications, or documentation
//                     </Text>
//                   </BlockStack>
//                 </InlineStack>

//                 <InlineStack gap="300" blockAlign="start">
//                   <Box
//                     background="bg-surface-warning"
//                     padding="200"
//                     borderRadius="200"
//                   >
//                     <Text
//                       as="p"
//                       variant="bodySm"
//                       fontWeight="bold"
//                       tone="critical"
//                     >
//                       3
//                     </Text>
//                   </Box>
//                   <BlockStack gap="100">
//                     <Text as="p" variant="bodyMd" fontWeight="medium">
//                       Organize & Manage
//                     </Text>
//                     <Text as="p" variant="bodySm" tone="subdued">
//                       Edit, delete, or update your PDF files as needed
//                     </Text>
//                   </BlockStack>
//                 </InlineStack>
//               </BlockStack>
//             </BlockStack>
//           </Card>

//           {/* Support Card */}
//           <Box paddingBlockStart="400">
//             <Card background="bg-surface-secondary">
//               <BlockStack gap="300">
//                 <Text as="p" variant="headingSm" fontWeight="bold">
//                   Need Help?
//                 </Text>
//                 <Text as="p" variant="bodySm" tone="subdued">
//                   Check out our documentation or contact support for assistance
//                   with PDF management.
//                 </Text>
//                 <InlineStack gap="200">
//                   <Button size="slim" variant="primary">
//                     Documentation
//                   </Button>
//                   <Button size="slim" variant="secondary">
//                     Contact Support
//                   </Button>
//                 </InlineStack>
//               </BlockStack>
//             </Card>
//           </Box>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import {
  Page,
  Card,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Box,
  Icon,
  Badge,
  Layout,
  Link,
  Banner,
  Divider,
  EmptyState,
} from "@shopify/polaris";
import {
  PlusIcon,
  ArrowUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ProductIcon,
  NoteIcon,
  ChartVerticalFilledIcon,
  UploadIcon,
  SearchIcon,
  CheckIcon,
  AlertCircleIcon,
  AttachmentIcon,
} from "@shopify/polaris-icons";

export default function PDFManagerHomePage() {
  return (
    <Page
      title="Product PDF Manager Dashboard"
      subtitle="Manage and organize PDF files for your products"
    >
      {/* Welcome Banner */}
      <Box paddingBlockEnd="400" padding="150">
        <Banner title="Welcome to Product PDF Manager" tone="info">
          <Text as="p" variant="bodyMd">
            Here you can Easily attach, manage, and organize PDF files for your
            products.
          </Text>
        </Banner>
      </Box>
      <Box paddingBlockEnd="400">
        {/* Middle Content Section */}
        {/* <Layout.Section> */}

        <BlockStack gap="500">
          {/* ================= MAIN ACTIONS ================= */}
          <Card padding="500">
            <BlockStack gap="400">
              <Text variant="headingLg" as="h2" fontWeight="bold">
                PDF Management Dashboard
              </Text>

              <Text as="p" variant="bodyMd" tone="subdued">
                Easily attach, manage, and organize PDF manuals for your product
                variants.
              </Text>

              <Divider />

              <InlineStack gap="500" wrap>
                {/* Upload PDF */}
                <Card>
                  <BlockStack gap="300" align="center">
                    <Icon source={UploadIcon} tone="base" />
                    <Text as="p" variant="headingSm" alignment="center" fontWeight="medium">
                      Upload PDF

                    </Text>
                    <Text
                      as="p"
                      variant="bodySm"
                      tone="subdued"
                      alignment="center"
                    >
                      Attach manuals or documents to product variants
                    </Text>
                    <Button
                      size="large"
                      variant="primary"
                      icon={UploadIcon}
                      url="/pdf/create"
                      fullWidth
                    >
                      Upload PDF
                    </Button>
                  </BlockStack>
                </Card>

                {/* View Products */}
                <Card>
                  <BlockStack gap="300" align="center">
                    <Icon source={ProductIcon} tone="base" />
                    <Text as="p"  alignment="center" variant="headingSm" fontWeight="medium">
                      Assigned Products
                    </Text>
                    <Text
                      as="p"
                      variant="bodySm"
                      tone="subdued"
                      alignment="center"
                    >
                      View products with attached PDFs
                    </Text>
                    <Button
                      size="large"
                      variant="primary"
                      icon={ProductIcon}
                      url="/pdf"
                      fullWidth
                    >
                      View Products
                    </Button>
                  </BlockStack>
                </Card>

                {/* Email Template */}
                <Card>
                  <BlockStack gap="300" align="center">
                    <Icon source={NoteIcon} tone="base" />
                    <Text as="p"  alignment="center" variant="headingSm" fontWeight="medium">
                      Email Template
                    </Text>
                    <Text
                      as="p"
                      variant="bodySm"
                      tone="subdued"
                      alignment="center"
                    >
                      Choose which email template is sent to customers
                    </Text>
                    <Button
                      size="large"
                      variant="primary"
                      icon={NoteIcon}
                      url="/pdf/email"
                      fullWidth
                    >
                      Set Template
                    </Button>
                  </BlockStack>
                </Card>
              </InlineStack>
            </BlockStack>
          </Card>

          {/* ================= GETTING STARTED ================= */}
          <Card padding="500">
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg" fontWeight="bold">
                Getting Started
              </Text>

              <Divider />

              <BlockStack gap="300">
                {/* Step 1 */}
                <InlineStack gap="300" blockAlign="start">
                  <Badge tone="info">Step 1</Badge>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      Select a Product
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Choose the product or variant you want to attach PDFs to.
                    </Text>
                  </BlockStack>
                </InlineStack>

                {/* Step 2 */}
                <InlineStack gap="300" blockAlign="start">
                  <Badge tone="success">Step 2</Badge>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      Upload PDF Files
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Upload manuals, guides, or specification documents.
                    </Text>
                  </BlockStack>
                </InlineStack>

                {/* Step 3 */}
                <InlineStack gap="300" blockAlign="start">
                  <Badge tone="warning">Step 3</Badge>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      Manage & Organize
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Edit, replace, or remove PDFs anytime from the dashboard.
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </BlockStack>

        {/* </Layout.Section> */}

        {/* Bottom Section - Tips & Getting Started */}
        {/* <Layout.Section> */}
        <BlockStack gap="400">
          {/* Tips & Best Practices Card */}
          <Card>
            <BlockStack gap="400">
              <Text as="p" variant="headingMd" fontWeight="bold">
                Tips & Best Practices
              </Text>
              <Divider />
              <BlockStack gap="300">
                <InlineStack gap="300" blockAlign="start">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      you just need to add a product only once after that all
                      variants will added after that by edit you can assign the
                      pdf to another varinats as well
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Once pdf assigned then pdf will save product name and
                      their variant name
                    </Text>
                  </BlockStack>
                </InlineStack>

                <InlineStack gap="300" blockAlign="start">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      Keep file sizes optimized
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Compress PDFs to reduce storage and improve loading times
                    </Text>
                  </BlockStack>
                </InlineStack>

                <InlineStack gap="300" blockAlign="start">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      you can all products also edit that variant manually{" "}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Group similar PDFs together for easier management
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>

      
        </BlockStack>
        {/* </Layout.Section> */}
      </Box>
    </Page>
  );
}
