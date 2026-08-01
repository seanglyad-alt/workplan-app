const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const file = path.resolve(process.cwd(), 'src/components/PageSettings.tsx');
const sourceText = fs.readFileSync(file, 'utf8');
const program = ts.createProgram([file], {
  jsx: ts.JsxEmit.ReactJSX,
  allowJs: true,
  allowImportingTsExtensions: true,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
  resolveJsonModule: true,
  skipLibCheck: true,
  noEmit: true,
  typeRoots: [path.join(process.cwd(), 'node_modules', '@types')]
});
const diagnostics = ts.getPreEmitDiagnostics(program);
console.log('diagnostics count', diagnostics.length);
for (const diag of diagnostics) {
  const fileName = diag.file ? diag.file.fileName : 'unknown';
  const start = diag.start || 0;
  const { line, character } = diag.file ? diag.file.getLineAndCharacterOfPosition(start) : { line: 0, character: 0 };
  const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
  console.log(`${fileName}:${line+1}:${character+1} - ${message}`);
}
