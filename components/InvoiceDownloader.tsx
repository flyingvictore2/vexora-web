"use client";

import React from "react";

interface InvoiceData {
    id: string;
    date: string;
    amount: string;
    plan: string;
}

export default function InvoiceDownloader({ invoice }: { invoice: InvoiceData }) {
    const generatePDF = async () => {
        const jsPDF = (await import("jspdf")).default;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("ANTIGRAVITY STREAM", 20, 20);

        doc.setFontSize(12);
        doc.text("INVOICE", 20, 40);
        doc.text(`Invoice ID: ${invoice.id}`, 20, 50);
        doc.text(`Date: ${invoice.date}`, 20, 60);

        doc.line(20, 70, 190, 70);

        doc.text("Description", 20, 80);
        doc.text("Amount", 160, 80);

        doc.line(20, 85, 190, 85);

        doc.text(`Subscription - ${invoice.plan} Plan`, 20, 95);
        doc.text(invoice.amount, 160, 95);

        doc.line(20, 110, 190, 110);

        doc.setFontSize(14);
        doc.text(`Total: ${invoice.amount}`, 160, 120);

        doc.save(`invoice_${invoice.id}.pdf`);
    };

    return (
        <button onClick={generatePDF} style={{ color: "#0070f3", textDecoration: "underline", cursor: "pointer", background: "none", border: "none", fontSize: "inherit" }}>
            Download PDF
        </button>
    );
}
