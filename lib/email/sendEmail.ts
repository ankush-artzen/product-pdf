import { Resend } from "resend";

const resend = new Resend(process.env.EMAIL_API_KEY);

interface SendEmailPayload {
  customerEmail: string;
  customerName: string;
  shop: string;
  links: string[];
  templteData?: {
    template: string;
    subject: string;
  }[];
}

export const sendEmail = async (payload: SendEmailPayload) => {
  try {
    const { customerEmail, customerName, shop, links, templteData } = payload;

    console.log("Email payload:", payload);

    /* 🔗 Build PDF links */
    const pdfList = links
      .map(
        (link) =>
          `<a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a>`,
      )
      .join("<br/>");

    /* 📧 Default email template */
    let emailTemplate = `
      Hello ${customerName},<br/><br/>
      Congratulations on your purchase!<br/>
      Here is the link to download your ebook:<br/><br/>
      ${pdfList}<br/><br/>
      If you face any issues with the download, feel free to contact us.<br/><br/>
      Happy reading!<br/><br/>
      Sensually yours,<br/>
      Juliette
    `;

    let templateSubject = "Femme Fatale Obsession";

    /* 🧩 Custom template override */
    if (templteData?.length) {
      const { template, subject } = templteData[0];

      emailTemplate = template
        .replace(/{NAME}/g, customerName)
        .replace(/{LINK}/g, pdfList)
        .replace(/{SHOP}/g, shop)
        .replace(/\n/g, "<br/>");

      templateSubject = subject;
    }

    console.log("Final Email:", templateSubject, emailTemplate);

    const { data, error } = await resend.emails.send({
      from: "Femme Fatale Obsession <refer@email.artzen.io>",
      to: [customerEmail],
      subject: templateSubject,
      html: emailTemplate,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Email send failed:", error);
    throw error;
  }
};
