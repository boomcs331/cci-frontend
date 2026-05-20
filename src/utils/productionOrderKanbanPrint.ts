import QRCode from "qrcode";
import type {
  ProductionOrderDetail,
  ProductionOrderLot,
  ProductProductionStepRow,
} from "@/types/production";
import { lotHasCompletedProcess, lotOperatorForProcess } from "@/utils/productionLotFlow";

export async function printProductionOrderKanbanTags(
  lots: ProductionOrderLot[],
  order: ProductionOrderDetail,
  steps: ProductProductionStepRow[]
): Promise<void> {
  if (lots.length === 0) return;
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const today = new Date();
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  const stdPack = order.lotSize || 100;
  const partNo = order.product?.productCode ?? "";
  const partName = order.product?.productName ?? "";
  const customerBrand =
    order.product?.customer?.name?.trim() ||
    order.product?.customer?.code?.trim() ||
    "";
  const orderedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder || a.id - b.id);

  const tags: string[] = [];
  for (const lot of lots) {
    const dataUrl = await QRCode.toDataURL(lot.qrCode, { width: 220, margin: 0 });
    const kanbanNo = String(lot.sequenceNo).padStart(3, "0");
    const fullQty = Math.floor(lot.quantity / stdPack);
    const remainQty = lot.quantity % stdPack;
    const lotMat = lot.lotPdNo || lot.lotNo || "";
    const qrLabel = `${partNo}/${stdPack}/${lot.sequenceNo}`;

    const flowHeaderCells =
      orderedSteps.length > 0
        ? orderedSteps
            .map((s) => {
              const p = s.process;
              const label = p
                ? `${p.processCode}${p.processName ? ` · ${p.processName}` : ""}`
                : `#${s.processId}`;
              return `<td class="lbl flow-step">${escapeHtml(label)}</td>`;
            })
            .join("")
        : `<td class="lbl flow-step" colspan="1">${escapeHtml("ยังไม่กำหนดลำดับขั้น (product_production_steps)")}</td>`;

    const flowStatusCells =
      orderedSteps.length > 0
        ? orderedSteps
            .map((s) => {
              const code = s.process?.processCode ?? "";
              const done = lotHasCompletedProcess(lot, code);
              return `<td class="check-cell">${done ? "&#10003;" : ""}</td>`;
            })
            .join("")
        : `<td></td>`;

    const flowOperatorCells =
      orderedSteps.length > 0
        ? orderedSteps
            .map((s) => {
              const code = s.process?.processCode ?? "";
              const label = lotOperatorForProcess(lot, code);
              return `<td class="operator-cell">${label ? escapeHtml(label) : "—"}</td>`;
            })
            .join("")
        : `<td class="operator-cell">—</td>`;

    tags.push(`
        <div class="kanban">
          <div class="vert"><div class="vert-inner">CHIEW CHAN INDUSTRY (1989)CO.,LTD.(CCI)</div></div>
          <div class="body">
            <table class="top">
              <colgroup>
                <col style="width:13%" />
                <col style="width:28%" />
                <col style="width:11%" />
                <col style="width:13%" />
                <col style="width:10%" />
                <col style="width:10%" />
                <col style="width:15%" />
              </colgroup>
              <tr>
                <td class="lbl">PART NO</td>
                <td class="val big">${escapeHtml(partNo)}</td>
                <td rowspan="5" class="customer-brand"><span>${escapeHtml(customerBrand || "—")}</span></td>
                <td class="lbl">Number Kanban</td>
                <td colspan="2" class="val big bold">${kanbanNo}</td>
                <td rowspan="5" class="qr">
                  <img src="${dataUrl}" alt="qr" />
                  <div class="qr-label">${escapeHtml(qrLabel)}</div>
                </td>
              </tr>
              <tr>
                <td rowspan="2" class="lbl">PART NAME</td>
                <td rowspan="2" class="val big">${escapeHtml(partName)}</td>
                <td rowspan="2" class="lbl">QTY</td>
                <td class="sublbl">จำนวนเต็ม</td>
                <td class="sublbl">จำนวนเศษ</td>
              </tr>
              <tr>
                <td class="val big">${fullQty}</td>
                <td class="val big">${remainQty}</td>
              </tr>
              <tr>
                <td class="lbl">วันเดือนปีผลิต</td>
                <td class="val">${dateStr}</td>
                <td rowspan="2" class="lbl">STD. PACKING</td>
                <td class="val">BOX</td>
                <td class="val">RACK <span class="check">&#10003;</span></td>
              </tr>
              <tr>
                <td class="lbl">Lot No. mat</td>
                <td class="val">${escapeHtml(lotMat)}</td>
                <td colspan="2" class="val big center">${stdPack}</td>
              </tr>
            </table>
            <table class="flow">
              <tr>
                <td class="lbl flow-lbl">Flow Process</td>
                ${flowHeaderCells}
              </tr>
              <tr class="status-row">
                <td class="lbl">สถานะ</td>
                ${flowStatusCells}
              </tr>
              <tr class="operator-row">
                <td class="lbl">ผู้ทำ</td>
                ${flowOperatorCells}
              </tr>
            </table>
          </div>
        </div>
      `);
  }

  const w = window.open("", "_blank");
  if (!w) {
    alert("กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์");
    return;
  }
  w.document.write(`<!DOCTYPE html><html><head><title>Kanban Tag — ${escapeHtml(order.orderNo)}</title>
      <meta charset="utf-8" />
      <style>
        @page { size: A4 portrait; margin: 8mm; }
        * { box-sizing: border-box; }
        html, body { background: #f0f0f0; }
        body { font-family: "Segoe UI", "Sarabun", "Tahoma", sans-serif; padding: 0; margin: 0; color: #000; }
        .toolbar {
          position: sticky; top: 0; z-index: 10;
          background: #fff; border-bottom: 1px solid #ddd;
          padding: 8px 12px; display: flex; gap: 8px; justify-content: flex-end;
        }
        .toolbar button {
          padding: 6px 14px; border: 1px solid #2563eb; background: #2563eb;
          color: #fff; border-radius: 6px; cursor: pointer; font-size: 13px;
        }
        .toolbar .secondary { background: #fff; color: #2563eb; }
        .sheet { width: 194mm; margin: 0 auto; padding: 4mm 0; }
        .kanban {
          display: flex; border: 1px solid #000; width: 100%;
          margin: 0 auto 1.2mm auto; page-break-inside: avoid; break-inside: avoid; background: #fff;
        }
        .vert { width: 18px; border-right: 1px solid #000; position: relative; overflow: hidden; flex-shrink: 0; }
        .vert-inner {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%) rotate(180deg);
          writing-mode: vertical-rl; white-space: nowrap;
          font-weight: 700; font-size: 7px;
        }
        .body { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        table.top, table.flow { width: 100%; border-collapse: collapse; table-layout: fixed; }
        table.top td, table.flow td {
          border: 1px solid #000; padding: 1px 3px; font-size: 8.5px; line-height: 1.15; vertical-align: middle;
        }
        .lbl { font-weight: 600; font-size: 8px; text-align: center; background: #fafafa; }
        .sublbl { font-size: 7.5px; text-align: center; background: #fafafa; }
        .val { text-align: center; }
        .val.big { font-size: 10.5px; font-weight: 700; }
        .val.center { text-align: center; }
        .bold { font-weight: 700; }
        .customer-brand { text-align: center; font-weight: 900; font-style: italic; font-size: 14px; }
        .customer-brand span { display: inline-block; transform: skewX(-10deg); }
        .qr { text-align: center; padding: 1px !important; }
        .qr img { width: 60px; height: 60px; display: block; margin: 0 auto; }
        .qr-label { font-size: 6.5px; font-family: monospace; margin-top: 1px; word-break: break-all; }
        .flow-lbl { width: 10%; min-width: 52px; }
        .flow-step { font-size: 7px; word-break: break-word; }
        .check-cell { font-size: 11px; font-weight: 700; }
        .operator-row td { font-size: 6.5px; line-height: 1.1; vertical-align: middle; }
        .operator-cell {
          text-align: center;
          font-weight: 600;
          word-break: break-word;
          padding: 1px 2px !important;
          max-width: 0;
        }
        @media print {
          html, body { background: #fff; }
          .toolbar { display: none; }
          .sheet { width: auto; padding: 0; margin: 0; }
        }
      </style></head><body>
      <div class="toolbar">
        <button class="secondary" onclick="window.close()">ปิด</button>
        <button onclick="window.print()">พิมพ์</button>
      </div>
      <div class="sheet">${tags.join("")}</div>
      <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); }</script>
      </body></html>`);
  w.document.close();
}
