const fs = require('fs');
const path = require('path');
const text = fs.readFileSync(path.join(process.cwd(), 'src/components/PageSettings.tsx'), 'utf8');
const regex = /<\/?([A-Za-z0-9_]+)([^>]*)>/g;
const selfClosing = new Set(['input','img','br','hr','meta','link','source','path','rect','circle','polygon','line','polyline','ellipse','stop']);
const stack = [];
const errors = [];
let m;
while ((m = regex.exec(text)) !== null) {
  const full = m[0];
  const closing = full.startsWith('</');
  const tag = m[1];
  const line = text.slice(0,m.index).split('\n').length;
  if (closing) {
    if (stack.length && stack[stack.length-1].tag === tag) {
      stack.pop();
    } else {
      errors.push({line, tag, top: stack[stack.length-1]});
    }
  } else {
    if (full.endsWith('/>') || selfClosing.has(tag.toLowerCase())) continue;
    stack.push({tag, line, text: full});
  }
}
console.log('remaining', stack.length);
if (stack.length) {
  stack.slice(-20).forEach(item => console.log('OPEN', item));
}
console.log('errors', errors.length);
errors.slice(0,20).forEach(e => console.log('ERROR', e));
