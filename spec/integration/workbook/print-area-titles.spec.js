const JSZip = require('jszip');

const ExcelJS = verquire('exceljs');

describe('Workbook', () => {
  describe('Print Area / Print Titles', () => {
    it('writes printArea and printTitles to workbook definedNames', async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Sheet1');

      ws.pageSetup.printArea = 'A1:C11';
      ws.pageSetup.printTitlesRow = '1:2';
      ws.pageSetup.printTitlesColumn = 'A:B';

      const buffer = await wb.xlsx.writeBuffer();
      const zip = await JSZip.loadAsync(buffer);

      const workbookXml = await zip.file('xl/workbook.xml').async('string');

      expect(workbookXml).to.match(
        /<definedName[^>]*name="_xlnm\.Print_Area"[^>]*localSheetId="0">(?:&apos;Sheet1&apos;|'Sheet1'|Sheet1)!\$A\$1:\$C\$11<\/definedName>/
      );
      expect(workbookXml).to.match(
        /<definedName[^>]*name="_xlnm\.Print_Titles"[^>]*localSheetId="0">(?:&apos;Sheet1&apos;|'Sheet1'|Sheet1)!\$A:\$B,(?:&apos;Sheet1&apos;|'Sheet1'|Sheet1)!\$1:\$2<\/definedName>/
      );
    });
  });
});

