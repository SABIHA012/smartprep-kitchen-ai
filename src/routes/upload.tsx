import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { FileUp, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, SyntheticBadge } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { parseCSV, recordsFromCSV, REQUIRED_COLUMNS, SIMULATED_COLUMNS, toCSV } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/upload")({
  head: () => seo("Dataset Upload", "Upload a restaurant orders CSV and preview its rows and columns."),
  component: Upload,
});

function Upload() {
  const { data, setData, resetData, source } = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; headers: string[]; rows: string[][] } | null>(null);
  const [drag, setDrag] = useState(false);

  const read = async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".csv")) { toast.error("Please choose a .csv file"); return; }
    const parsed = parseCSV(await f.text());
    if (!parsed.headers.length) { toast.error("The file looks empty"); return; }
    setFile({ name: f.name, ...parsed });
  };
  const missing = file ? REQUIRED_COLUMNS.filter((c) => !file.headers.includes(c)) : [];
  const apply = () => {
    if (!file) return;
    const recs = recordsFromCSV(file.headers, file.rows);
    if (!recs?.length) { toast.error("Missing required columns"); return; }
    setData(recs, `${file.name} (${recs.length} rows, uploaded)`);
    toast.success("Dataset now powers every page");
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([toCSV(data)], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "smartprep_synthetic_dataset.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Dataset upload" subtitle={`Currently using: ${source}`}>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={download}><Download className="h-4 w-4" />Sample CSV</Button>
          <Button variant="outline" size="sm" onClick={() => { resetData(); toast("Back to the synthetic sample"); }}><RotateCcw className="h-4 w-4" />Reset</Button>
        </div>
      </PageHeader>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) read(f); }}
        onClick={() => input.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${drag ? "border-primary bg-accent/40" : "border-border bg-card hover:bg-muted"}`}>
        <FileUp className="mx-auto h-10 w-10 text-primary" />
        <p className="mt-3 font-semibold">Drop a CSV here or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">Required columns to use it in forecasts: {REQUIRED_COLUMNS.join(", ")}</p>
        <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f); e.target.value = ""; }} />
      </div>

      {file && (
        <Panel className="mt-6" title={`${file.name} — ${file.rows.length} rows × ${file.headers.length} columns`}
          action={<Button size="sm" disabled={missing.length > 0} onClick={apply}>Use this dataset</Button>}>
          {missing.length > 0 && <p className="mb-3 rounded-lg bg-warning/20 p-3 text-xs text-warning-foreground">Preview only — missing columns: {missing.join(", ")}</p>}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {file.headers.map((h) => (
              <span key={h} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${h === "orders" ? "bg-primary text-primary-foreground" : SIMULATED_COLUMNS.includes(h) ? "bg-warning/25 text-warning-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {h}{h === "orders" ? " · target" : SIMULATED_COLUMNS.includes(h) ? " · simulated, not an input" : ""}
              </span>
            ))}
          </div>
          <div className="max-h-[480px] overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader><TableRow>{file.headers.map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}</TableRow></TableHeader>
              <TableBody>{file.rows.slice(0, 50).map((r, i) => <TableRow key={i}>{file.headers.map((h, j) => <TableCell key={h} className="whitespace-nowrap text-xs">{r[j]}</TableCell>)}</TableRow>)}</TableBody>
            </Table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Showing first {Math.min(50, file.rows.length)} rows.</p>
        </Panel>
      )}
      <Panel className="mt-6" title="About the sample data" action={<SyntheticBadge />}>
        <p className="text-sm text-muted-foreground">
          The built-in dataset has 720 synthetic records (10 meals × 4 centres × 18 weeks). Orders is the prediction target. Columns starting with
          <code className="mx-1 rounded bg-muted px-1">sim_</code>are simulated kitchen behaviour used only for waste illustrations — never as prediction inputs.
        </p>
      </Panel>
    </>
  );
}
