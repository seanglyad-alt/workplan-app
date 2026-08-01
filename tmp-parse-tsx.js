const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const file = path.resolve(process.cwd(), 'src/components/PageSettings.tsx');
const sourceText = fs.readFileSync(file, 'utf8');
const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([file], { jsx: ts.JsxEmit.ReactJSX, allowJs: true, allowImportingTsExtensions: true, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, resolveJsonModule: true }));
console.log('diagnostics count', diagnostics.length);
diagnostics.forEach(diag => {
  const { line, character } = diag.file ? diag.file.getLineAndCharacterOfPosition(diag.start) : { line: 0, character: 0 };
  const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
  console.log(`${diag.file ? diag.file.fileName : 'unknown'}:${line+1}:${character+1} - ${message}`);
});
