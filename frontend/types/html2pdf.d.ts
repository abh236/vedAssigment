declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: Record<string, unknown>;
    jsPDF?: Record<string, unknown>;
    pagebreak?: { mode?: string | string[]; before?: string | string[]; after?: string | string[]; avoid?: string | string[] };
    enableLinks?: boolean;
  }
  interface Html2Pdf {
    set(options: Html2PdfOptions): Html2Pdf;
    from(element: HTMLElement): Html2Pdf;
    save(): Promise<void>;
    output(type: string): Promise<unknown>;
    toPdf(): Html2Pdf;
  }
  function html2pdf(): Html2Pdf;
  export = html2pdf;
}
