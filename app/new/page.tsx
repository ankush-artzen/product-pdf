"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function GeneratedPdfsPage() {
  const { data, error } = useSWR("/api/generated-pdfs", fetcher);

  if (error) return <div>Failed to load PDFs</div>;
  if (!data) return <div>Loading...</div>;

  const records = data.records || [];

  return (
    <div style={{ padding: 24 }}>
      <h1>Generated PDFs</h1>
      {records.length === 0 ? (
        <p>No PDFs generated yet.</p>
      ) : (
        <table
          style={{ marginTop: 16, borderCollapse: "collapse", width: "100%" }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>Order #</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>Language</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>PDF</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r: any) => (
              <tr key={r.id}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {r.orderNumber}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {r.language}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  <a href={r.pdfUrl} target="_blank" rel="noreferrer">
                    Download
                  </a>
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {new Date(r.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
