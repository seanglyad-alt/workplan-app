const ts = require('./node_modules/typescript/lib/typescript');
const fs = require('fs');
const path = require('path');
const fileName = path.join(__dirname, 'src', 'components', 'PageSettings.tsx');
const opts = {
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  allowJs: true,
  checkJs: false,
  allowImportingTsExtensions: true,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  noEmit: true,
};
const host = ts.createCompilerHost(opts);
host.readFile = (filePath) => fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : undefined;
host.fileExists = (filePath) => fs.existsSync(filePath);
host.getSourceFile = (filePath, languageVersion) => {
  if (!fs.existsSync(filePath)) return undefined;
  const text = fs.readFileSync(filePath, 'utf8');
  return ts.createSourceFile(filePath, text, languageVersion, true, ts.ScriptKind.TSX);
};
const program = ts.createProgram([fileName], opts, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
console.log('DIAGNOSTIC COUNT', diagnostics.length);
for (const d of diagnostics) {
  const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  if (d.file && d.start !== undefined) {
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
    console.log(`${d.file.fileName}(${line+1},${character+1}): ${message}`);
  } else {
    console.log(message);
  }
}
