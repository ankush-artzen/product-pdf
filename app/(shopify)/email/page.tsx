import { Suspense } from "react";
import { EmailTemplatesContent } from "./EmailTemplatesContent";

export default function EmailTemplates() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailTemplatesContent />
    </Suspense>
  );
}
