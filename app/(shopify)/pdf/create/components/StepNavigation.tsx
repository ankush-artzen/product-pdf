import {
  Card,
  Text,
  BlockStack,
  Box,
  InlineStack,
  Divider,
} from "@shopify/polaris";

interface Step {
  number: number;
  title: string;
  description: string;
  enabled: boolean;
  onClick: () => void;
}

interface StepNavigationProps {
  steps: Step[];
  currentStep: number;
}

export function StepNavigation({ steps, currentStep }: StepNavigationProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="p" variant="headingMd" fontWeight="bold">
          Setup Steps
        </Text>
        <Divider />
        <BlockStack gap="200">
          {steps.map((step) => (
            <div
              key={step.number}
              onClick={step.onClick}
              style={{
                padding: "8px",
                cursor: step.enabled ? "pointer" : "not-allowed",
                opacity: step.enabled ? 1 : 0.5,
                borderRadius: "3px",
              }}
            >
              <InlineStack align="start" gap="300" blockAlign="center">
                <Box
                  background={
                    currentStep === step.number
                      ? "bg-fill-tertiary"
                      : "bg-surface-secondary"
                  }
                  padding="200"
                  borderRadius="200"
                  minWidth="24px"
                  minHeight="24px"
                >
                  <Text
                    as="p"
                    variant="bodySm"
                    alignment="center"
                    fontWeight="bold"
                    tone={currentStep === step.number ? "success" : "subdued"}
                  >
                    {step.number}
                  </Text>
                </Box>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" fontWeight="medium">
                    {step.title}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {step.description}
                  </Text>
                </BlockStack>
              </InlineStack>
            </div>
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

