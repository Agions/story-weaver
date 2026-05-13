/**
 * panel-flow PDF Export Utility
 */

import { jsPDF } from 'jspdf';

import 'jspdf-autotable';
import { formatTime } from '@/shared/utils';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: unknown) => jsPDF;
  }
}

export const exportScriptToPDF = (
  script: {
    content: Array<{
      startTime: number;
      endTime: number;
      content: string;
      type: string;
    }>;
    createdAt: string;
    updatedAt: string;
  },
  projectName: string
) => {
  const doc = new jsPDF();

  const title = `${projectName} - 解说脚本`;
  doc.setProperties({
    title,
    author: 'panel-flow AI',
    creator: 'panel-flow AI Script Generator',
    subject: '视频解说脚本',
  });

  doc.setFontSize(18);
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.text(`创建时间: ${new Date(script.createdAt).toLocaleString()}`, 14, 30);
  doc.text(`最后更新: ${new Date(script.updatedAt).toLocaleString()}`, 14, 35);

  const totalDuration = script.content.reduce(
    (acc, segment) => acc + (segment.endTime - segment.startTime),
    0
  );
  doc.text(`总时长: ${Math.floor(totalDuration / 60)}分${totalDuration % 60}秒`, 14, 40);
  doc.text(`段落数: ${script.content.length}`, 14, 45);

  const tableData = script.content.map((segment) => [
    `${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`,
    segment.type === 'narration' ? '旁白' : segment.type === 'dialogue' ? '对话' : '描述',
    segment.content,
  ]);

  doc.autoTable({
    startY: 50,
    head: [['时间', '类型', '内容']],
    body: tableData,
    headStyles: { fillColor: [24, 144, 255] },
    styles: { overflow: 'linebreak', cellWidth: 'auto' },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 25 },
      2: { cellWidth: 'auto' },
    },
  });

  const pageCount = (doc.internal as any).pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `panel-flow AI - 第 ${i} 页，共 ${pageCount} 页`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const filename = `${projectName.replace(/[^\w\s]/gi, '')}_脚本_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);

  return filename;
};
