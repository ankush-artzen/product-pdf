"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  Select,
  Button,
  TextField,
  BlockStack,
  Text,
  List,
  Box,
  Banner,
  Spinner,
  InlineStack,
  Icon,
  Badge,
  IndexTable,
  useIndexResourceState,
  LegacyCard,
  EmptyState,
  Modal,
} from "@shopify/polaris";
import {
  DeleteIcon,
  EditIcon,
  PlusIcon,
  NoteIcon,
} from "@shopify/polaris-icons";
import { useSearchParams, useRouter } from "next/navigation";
import App from "next/app";
import { useAppBridge } from "@shopify/app-bridge-react";

// Type Definitions
interface Template {
  id: string | null;
  language: string;
  template: string;
  subject: string;
  shop: string;
  updated_at: string;
  [key: string]: unknown;
}

interface TemplateResponse {
  templates: Template[];
}

interface SaveTemplateResponse {
  status: boolean;
  message: string;
  data?: {
    id: string;
    [key: string]: any;
  };
}

interface DeleteTemplateResponse {
  status: boolean;
  message: string;
}

interface LanguageOption {
  label: string;
  value: string;
  code: string;
}

interface SaveTemplatePayload {
  base_url: string;
  shop: string;
  language: string;
  template: string;
  subject: string;
  templateId: string | null;
}

interface Message {
  type: "error" | "success" | "info" | "";
  text: string;
}

const saveTemplate = async (
  payload: SaveTemplatePayload
): Promise<SaveTemplateResponse> => {
  try {
    const response = await fetch(`${payload.base_url}/api/templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shop: payload.shop,
        language: payload.language,
        template: payload.template,
        subject: payload.subject,
        templateId: payload.templateId,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error saving template:", error);
    return { status: false, message: "Network error" };
  }
};

const getTemplate = async ({
  base_url,
  shop,
}: {
  base_url: string;
  shop: string;
}): Promise<TemplateResponse> => {
  try {
    const response = await fetch(
      `${base_url}/api/templates?shop=${encodeURIComponent(shop)}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { templates: [] };
  }
};

const deleteTemplate = async ({
  base_url,
  templateId,
  shop,
}: {
  base_url: string;
  templateId: string;
  shop: string;
}): Promise<DeleteTemplateResponse> => {
  try {
    const response = await fetch(
      `${base_url}/api/templates/${templateId}?shop=${encodeURIComponent(shop)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.error("Error deleting template:", error);
    return { status: false, message: "Network error" };
  }
};

export function EmailTemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [store, setStore] = useState<string>("");
  const [BACKEND_URL, setBackendUrl] = useState<string>("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedLanguage, setSelectedLanguage] = useState<string>("Anglais");
  const [templateContent, setTemplateContent] = useState<string>("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<Message>({ type: "", text: "" });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [selectedTemplateForDelete, setSelectedTemplateForDelete] = useState<
    string | null
  >(null);
  const [shop, setShop] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const app = useAppBridge();

  // API Functions
  const languageOptions: LanguageOption[] = [
    { label: "Anglais (English)", value: "Anglais", code: "en" },
    { label: "Français (French)", value: "Français", code: "fr" },
    { label: "Español (Spanish)", value: "Español", code: "es" },
    { label: "Deutsch (German)", value: "Deutsch", code: "de" },
    { label: "Italiano (Italian)", value: "Italiano", code: "it" },
    { label: "日本語 (Japanese)", value: "日本語", code: "ja" },
  ];

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(templates);
    
  useEffect(() => {
    const shopFromConfig = (app as any)?.config?.shop;

    if (shopFromConfig) {
      setShop(shopFromConfig);
    } else {
      setError("Unable to retrieve shop info. Please reload the app.");
    }
  }, [app]);
  
  console.log("shop-----------", shop);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const shop =
          searchParams.get("shop") || localStorage.getItem("shop") || "";

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

        setStore(shop);
        setBackendUrl(backendUrl);

        if (shop) {
          const response = await getTemplate({
            base_url: backendUrl,
            shop,
          });

          if (response?.templates) {
            setTemplates(response.templates);

            if (response.templates.length > 0) {
              const initialTemplate =
                response.templates.find((t) => t.language === "Anglais") ||
                response.templates[0];

              setSelectedLanguage(initialTemplate.language);
              setTemplateContent(initialTemplate.template || "");
              setSubject(initialTemplate.subject || "");
              setTemplateId(initialTemplate.id || null);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setMessage({
          type: "error",
          text: "Failed to load templates.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!shop) {
      setMessage({
        type: "error",
        text: "shop information not available. Please refresh the page.",
      });
      return;
    }

    if (!templateContent.trim()) {
      setMessage({ type: "error", text: "Template content cannot be empty" });
      return;
    }

    if (!subject.trim()) {
      setMessage({ type: "error", text: "Subject cannot be empty" });
      return;
    }

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    const payload: SaveTemplatePayload = {
      language: selectedLanguage,
      template: templateContent.trim(),
      shop,
      subject: subject.trim(),
      base_url: BACKEND_URL,
      templateId,
    };

    try {
      const response = await saveTemplate(payload);

      if (response.status) {
        setMessage({
          type: "success",
          text: response.message || "Template saved successfully!",
        });

        if (response.data) {
          const updatedTemplate: Template = {
            id: response.data.id || templateId,
            language: selectedLanguage,
            template: templateContent.trim(),
            subject: subject.trim(),
            shop,
            updated_at: new Date().toISOString(),
          };

          setTemplates((prev) => {
            const existingIndex = prev.findIndex(
              (temp) => temp.language === selectedLanguage
            );
            if (existingIndex !== -1) {
              const newData = [...prev];
              newData[existingIndex] = updatedTemplate;
              return newData;
            } else {
              return [...prev, updatedTemplate];
            }
          });

          setTemplateId(updatedTemplate.id);
        }

        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({
          type: "error",
          text: response.message || "Failed to save template",
        });
      }
    } catch (error) {
      console.error("Error saving template:", error);
      setMessage({
        type: "error",
        text: "An error occurred while saving the template",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (
    templateToDelete: string | null = null
  ) => {
    const templateIdToDelete = templateToDelete || templateId;
    if (!templateIdToDelete || !shop) {
      setMessage({
        type: "error",
        text: "No template selected to delete",
      });
      return;
    }

    setIsSaving(true);
    try {
      const deleteResponse = await deleteTemplate({
        base_url: BACKEND_URL,
        templateId: templateIdToDelete,
        shop,
      });

      if (deleteResponse.status) {
        setMessage({ type: "success", text: "Template deleted successfully!" });

        // Remove from local state
        setTemplates((prev) =>
          prev.filter((temp) => temp.id !== templateIdToDelete)
        );

        if (templateIdToDelete === templateId) {
          // If deleting current template, reset to first available
          if (templates.length > 1) {
            const remainingTemplates = templates.filter(
              (temp) => temp.id !== templateIdToDelete
            );
            if (remainingTemplates.length > 0) {
              const firstTemplate = remainingTemplates[0];
              setSelectedLanguage(firstTemplate.language);
              setTemplateContent(firstTemplate.template || "");
              setSubject(firstTemplate.subject || "");
              setTemplateId(firstTemplate.id || null);
            } else {
              resetForm();
            }
          } else {
            resetForm();
          }
        }

        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        setDeleteModalOpen(false);
      } else {
        setMessage({
          type: "error",
          text: deleteResponse.message || "Failed to delete template",
        });
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      setMessage({
        type: "error",
        text: "An error occurred while deleting the template",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedLanguage("Anglais");
    setTemplateContent("");
    setSubject("");
    setTemplateId(null);
  };

  const handleLanguageSelect = useCallback(
    (value: string) => {
      setSelectedLanguage(value);
      const selectedTemplate = templates.find(
        (temp) => temp.language === value
      );
      if (selectedTemplate) {
        setSubject(selectedTemplate.subject || "");
        setTemplateContent(selectedTemplate.template || "");
        setTemplateId(selectedTemplate.id || null);
      } else {
        setSubject("");
        setTemplateContent("");
        setTemplateId(null);
      }
    },
    [templates]
  );

  const handleEditTemplate = (template: Template) => {
    setSelectedLanguage(template.language);
    setSubject(template.subject || "");
    setTemplateContent(template.template || "");
    setTemplateId(template.id || null);
    setActiveTab("edit");
  };

  const handleNewTemplate = () => {
    resetForm();
    setActiveTab("edit");
  };

  const languageBadge = (language: string): string => {
    const languageCodes: Record<string, string> = {
      Anglais: "EN",
      Français: "FR",
      Español: "ES",
      Deutsch: "DE",
      Italiano: "IT",
      日本語: "JA",
    };
    return languageCodes[language] || language.substring(0, 2).toUpperCase();
  };

  const getLanguageFlag = (code: string): string => {
    const flags: Record<string, string> = {
      en: "🇺🇸",
      fr: "🇫🇷",
      es: "🇪🇸",
      de: "🇩🇪",
      it: "🇮🇹",
      ja: "🇯🇵",
    };
    return flags[code] || "🌐";
  };

  if (isLoading) {
    return (
      <Page
        title="Email Templates"
        backAction={{ content: "Dashboard", url: "/dashboard" }}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "40px",
                }}
              >
                <Spinner size="large" />
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const selectedLanguageOption = languageOptions.find(
    (lang) => lang.value === selectedLanguage
  );

  return (
    <Page
      title="Email Templates"
      backAction={{ content: "Dashboard", url: "/dashboard" }}
      primaryAction={{
        content: "New Template",
        icon: PlusIcon,
        onAction: handleNewTemplate,
        disabled: !shop,
      }}
    >
      <Layout>
        <Layout.Section>
          {!shop ? (
            <Banner tone="critical" title="shop Not Found">
              <Text as="p">
                Store information not available. Please access this page through
                Shopify Admin.
              </Text>
            </Banner>
          ) : (
            <LegacyCard>
              <div
                style={{ padding: "20px", borderBottom: "1px solid #e1e3e5" }}
              >
                <InlineStack gap="200">
                  <Button
                    pressed={activeTab === "edit"}
                    onClick={() => setActiveTab("edit")}
                    variant="plain"
                    icon={EditIcon}
                  >
                    Edit Template
                  </Button>
                  <Button
                    pressed={activeTab === "list"}
                    onClick={() => setActiveTab("list")}
                    variant="plain"
                  >
                    All Templates ({templates.length.toString()})
                  </Button>
                  <Button
                    pressed={activeTab === "preview"}
                    onClick={() => setActiveTab("preview")}
                    variant="plain"
                    icon={NoteIcon}
                  >
                    Preview
                  </Button>
                </InlineStack>
              </div>

              {message.text && (
                <div style={{ padding: "20px 20px 0" }}>
                  <Banner
                    tone={
                      message.type === "error"
                        ? "critical"
                        : message.type === "success"
                          ? "success"
                          : "info"
                    }
                    onDismiss={() => setMessage({ type: "", text: "" })}
                  >
                    <Text as="p">{message.text}</Text>
                  </Banner>
                </div>
              )}

              {activeTab === "edit" && (
                <div style={{ padding: "20px" }}>
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingLg">
                        Edit Email Template
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Create and customize email templates for different
                        languages
                      </Text>
                    </BlockStack>

                    <FormLayout>
                      <InlineStack gap="400" blockAlign="end">
                        <Select
                          label="Language"
                          options={languageOptions}
                          onChange={handleLanguageSelect}
                          value={selectedLanguage}
                          disabled={isSaving || !shop}
                          //   prefix={<Icon source={GlobeIcon} />}
                        />
                        {templateId && (
                          <Text as="p" tone="success">
                            {languageBadge(selectedLanguage)} - Saved
                          </Text>
                        )}
                      </InlineStack>

                      <TextField
                        label="Email Subject"
                        helpText="This will be the subject line of the email sent to customers"
                        placeholder="Your PDF is ready from {SHOP}!"
                        value={subject}
                        onChange={(value) => setSubject(value)}
                        autoComplete="off"
                        disabled={isSaving || !shop}
                        requiredIndicator
                      />

                      <TextField
                        label="Email Content"
                        helpText="Write your email template here. Use variables to personalize the message."
                        placeholder="Hi {NAME}, ..."
                        value={templateContent}
                        onChange={(value) => setTemplateContent(value)}
                        multiline={10}
                        autoComplete="off"
                        disabled={isSaving || !shop}
                        requiredIndicator
                        showCharacterCount
                        maxLength={5000}
                      />

                      <InlineStack gap="200" align="end">
                        <Button
                          onClick={handleSubmit}
                          loading={isSaving}
                          disabled={!shop}
                        >
                          {templateId ? "Update Template" : "Save Template"}
                        </Button>

                        {templateId && (
                          <Button
                            onClick={() => {
                              setSelectedTemplateForDelete(templateId);
                              setDeleteModalOpen(true);
                            }}
                            disabled={isSaving}
                          >
                            Delete
                          </Button>
                        )}
                      </InlineStack>
                    </FormLayout>
                  </BlockStack>
                </div>
              )}

              {activeTab === "list" && (
                <div style={{ padding: "20px" }}>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="200">
                        <Text as="h2" variant="headingLg">
                          All Templates
                        </Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          {templates.length} template
                          {templates.length !== 1 ? "s" : ""} configured
                        </Text>
                      </BlockStack>
                      <Button icon={PlusIcon} onClick={handleNewTemplate}>
                        New Template
                      </Button>
                    </InlineStack>

                    {templates.length === 0 ? (
                      <EmptyState
                        heading="No templates yet"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        action={{
                          content: "Create First Template",
                          onAction: handleNewTemplate,
                        }}
                        secondaryAction={{
                          content: "Learn more",
                          url: "https://help.shopify.com",
                        }}
                      >
                        <p>
                          Create email templates to personalize customer
                          communications.
                        </p>
                      </EmptyState>
                    ) : (
                      <IndexTable
                        resourceName={{
                          singular: "template",
                          plural: "templates",
                        }}
                        itemCount={templates.length}
                        selectedItemsCount={
                          allResourcesSelected
                            ? "All"
                            : selectedResources.length
                        }
                        onSelectionChange={handleSelectionChange}
                        headings={[
                          { title: "Language" },
                          { title: "Subject" },
                          { title: "Last Updated" },
                          { title: "Actions" },
                        ]}
                      >
                        {templates.map((template, index) => {
                          const langCode =
                            languageOptions.find(
                              (l) => l.value === template.language
                            )?.code || "en";
                          return (
                            <IndexTable.Row
                              id={template.id || index.toString()}
                              key={template.id || index.toString()}
                              selected={selectedResources.includes(
                                template.id || ""
                              )}
                              position={index}
                            >
                              <IndexTable.Cell>
                                <InlineStack gap="200" align="center">
                                  <Text as="span" variant="bodyLg">
                                    {getLanguageFlag(langCode)}
                                  </Text>
                                  <Text
                                    as="span"
                                    variant="bodyMd"
                                    fontWeight="semibold"
                                  >
                                    {template.language}
                                  </Text>
                                  <Badge>
                                    {languageBadge(template.language)}
                                  </Badge>
                                </InlineStack>
                              </IndexTable.Cell>
                              <IndexTable.Cell>
                                <Text as="p" variant="bodyMd" truncate>
                                  {template.subject}
                                </Text>
                              </IndexTable.Cell>
                              <IndexTable.Cell>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {new Date(
                                    template.updated_at
                                  ).toLocaleDateString()}
                                </Text>
                              </IndexTable.Cell>
                              <IndexTable.Cell>
                                <InlineStack gap="100">
                                  <Button
                                    icon={EditIcon}
                                    onClick={() => handleEditTemplate(template)}
                                    variant="plain"
                                  />
                                  <Button
                                    icon={DeleteIcon}
                                    onClick={() => {
                                      setSelectedTemplateForDelete(template.id);
                                      setDeleteModalOpen(true);
                                    }}
                                    variant="plain"
                                  />
                                </InlineStack>
                              </IndexTable.Cell>
                            </IndexTable.Row>
                          );
                        })}
                      </IndexTable>
                    )}
                  </BlockStack>
                </div>
              )}

              {activeTab === "preview" && (
                <div style={{ padding: "20px" }}>
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingLg">
                        Template Preview
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        See how your email will look with sample data
                      </Text>
                    </BlockStack>

                    <Card padding="400" background="bg-surface-secondary">
                      <BlockStack gap="400">
                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm">
                            Preview Data
                          </Text>
                          <InlineStack gap="400">
                            <div style={{ flex: 1 }}>
                              <TextField
                                label="Customer Name"
                                value="John Doe"
                                autoComplete="off"
                                readOnly
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <TextField
                                label="Shop Name"
                                value="My Awesome Store"
                                autoComplete="off"
                                readOnly
                              />
                            </div>
                          </InlineStack>
                        </BlockStack>

                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm">
                            Email Preview
                          </Text>
                          <Card padding="400" background="bg">
                            <BlockStack gap="300">
                              <Text
                                as="p"
                                variant="bodyMd"
                                fontWeight="semibold"
                              >
                                Subject:{" "}
                                {subject.replace(/{SHOP}/g, "My Awesome Store")}
                              </Text>
                              <div
                                style={{
                                  padding: "20px",
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #e1e3e5",
                                  borderRadius: "8px",
                                  fontFamily:
                                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  lineHeight: "1.6",
                                  color: "#202223",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {templateContent
                                  .replace(/{NAME}/g, "John Doe")
                                  .replace(/{SHOP}/g, "My Awesome Store")
                                  .replace(
                                    /{LINK}/g,
                                    "https://example.com/download/123"
                                  )
                                  .replace(/{ORDER_NUMBER}/g, "#1234")
                                  .replace(
                                    /{ORDER_DATE}/g,
                                    new Date().toLocaleDateString()
                                  )}
                              </div>
                            </BlockStack>
                          </Card>
                        </BlockStack>

                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm">
                            Available Variables
                          </Text>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fill, minmax(220px, 1fr))",
                              gap: "12px",
                            }}
                          >
                            {[
                              {
                                variable: "{{customer_name}}",
                                description: "Customer name",
                                example: "John Doe",
                              },
                              { 
                                variable: "{{order_name}}", 
                                description: "Order name/number", 
                                example: "#1001" 
                              },
                              { 
                                variable: "{{order_id}}", 
                                description: "Order ID", 
                                example: "123456789" 
                              },
                              { 
                                variable: "{{products}}", 
                                description: "Product list HTML", 
                                example: "<ul><li>Product 1</li></ul>" 
                              },
                              { 
                                variable: "{{pdf_links}}", 
                                description: "PDF download links HTML", 
                                example: "<div>Download links...</div>" 
                              },
                              { 
                                variable: "{{pdf_count}}", 
                                description: "Number of PDFs", 
                                example: "3" 
                              },
                              { 
                                variable: "{{shop}}", 
                                description: "Store name", 
                                example: "My Store" 
                              },
                              { 
                                variable: "{{customer_email}}", 
                                description: "Customer email", 
                                example: "customer@email.com" 
                              },
                              { 
                                variable: "{{currency}}", 
                                description: "Currency code", 
                                example: "USD" 
                              },
                              { 
                                variable: "{{total_amount}}", 
                                description: "Order total amount", 
                                example: "99.99" 
                              },
                            ].map((item, index) => (
                              <Card key={index} padding="200">
                                <BlockStack gap="100">
                                  <Badge tone="info">{item.variable}</Badge>
                                  <Text
                                    as="span"
                                    variant="bodySm"
                                  >
                                    {item.description}
                                  </Text>
                                  <Text
                                    as="span"
                                    variant="bodySm"
                                    tone="subdued"
                                  >
                                    Example: {item.example}
                                  </Text>
                                </BlockStack>
                              </Card>
                            ))}
                          </div>
                          
                        </BlockStack>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                </div>
              )}
            </LegacyCard>
          )}
        </Layout.Section>

        {activeTab === "edit" && (
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    🚀 Quick Start Guide
                  </Text>
                  <List type="bullet">
                    <List.Item>Select language for your template</List.Item>
                    <List.Item>Browse recommended industry templates</List.Item>
                    <List.Item>Customize subject and content</List.Item>
                    <List.Item>Use variables for personalization</List.Item>
                    <List.Item>Save and preview before sending</List.Item>
                  </List>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    ✨ Pro Tips
                  </Text>
                  <Card padding="300" background="bg-surface-secondary">
                    <BlockStack gap="200">
                      <InlineStack align="start" gap="200">
                        <Badge tone="success">Tip 1</Badge>
                        <Text as="p" variant="bodySm">
                          Keep subject lines under 50 characters for best open
                          rates
                        </Text>
                      </InlineStack>
                      <InlineStack align="start" gap="200">
                        <Badge tone="success">Tip 2</Badge>
                        <Text as="p" variant="bodySm">
                          Personalized emails have 26% higher open rates
                        </Text>
                      </InlineStack>
                      <InlineStack align="start" gap="200">
                        <Badge tone="success">Tip 3</Badge>
                        <Text as="p" variant="bodySm">
                          Include clear call-to-action for downloads
                        </Text>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    📊 Statistics
                  </Text>
                  <Card padding="300" background="bg-surface-secondary">
                    <BlockStack gap="100">
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodySm">
                          Open Rate
                        </Text>
                        <Text as="span" variant="bodySm" fontWeight="semibold">
                          24.8%
                        </Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodySm">
                          Click Rate
                        </Text>
                        <Text as="span" variant="bodySm" fontWeight="semibold">
                          4.2%
                        </Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodySm">
                          Conversion Rate
                        </Text>
                        <Text as="span" variant="bodySm" fontWeight="semibold">
                          2.7%
                        </Text>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Template"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: () => handleDeleteTemplate(selectedTemplateForDelete),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setDeleteModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              Are you sure you want to delete this template? This action cannot
              be undone.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
