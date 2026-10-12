from pathlib import Path
import hashlib,json,re,zipfile,posixpath
root=Path('p1-work/map-platform')
base=json.loads(Path('p1-work/original-hashes.json').read_text());changed=[]
for group in ['archives','sources']:
 for name,h in base[group].items():
  p=Path(name)
  if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=h:changed.append(name)
report={'source_count':len(base['sources']),'archive_count':len(base['archives']),'changed':changed,'result':'PASS' if not changed else 'FAIL'}
(root/'evidence/p1/final-integrity.json').write_text(json.dumps(report,indent=2))
# Maintain old relative references in historical root documents relocated under evidence/p1.
for p in (root/'evidence/p1').glob('p0-patch-*.md'):
 s=p.read_text();s=re.sub(r'(\]\()([^\s\)#]+)(\))',lambda m:m[1]+('../../'+m[2] if not re.match(r'^(https?:|#|\.\./\.\./)',m[2]) else m[2])+m[3],s);p.write_text(s)
broken=[]
for p in root.rglob('*.md'):
 for x in re.findall(r'\]\(([^\s\)]+)\)',p.read_text()):
  if re.match(r'^(https?:|mailto:|#)',x):continue
  f=x.split('#')[0]
  if f and not (p.parent/f).exists():broken.append({'document':str(p.relative_to(root)),'target':x})
assets=[]
for p in (root/'prototype').rglob('*.css'):
 for x in re.findall(r'url\([\'"]?([^\)\'\"]+)',p.read_text()):
  if not x.startswith('data:') and not (p.parent/x).exists():assets.append(x)
js=(root/'prototype/app.js').read_text()
forbidden=re.findall(r'\b(?:fetch|XMLHttpRequest|WebSocket|indexedDB|localStorage|sessionStorage)\s*(?:\(|\.)',js)
zipbroken=[]
with zipfile.ZipFile('map-workspace-p0-decision-patch.zip') as z:
 names=set(z.namelist())
 for n in names:
  if n.endswith('.md'):
   for x in re.findall(r'\]\(([^\s\)]+)\)',z.read(n).decode()):
    if re.match(r'^(https?:|mailto:|#)',x):continue
    f=x.split('#')[0]
    if f and posixpath.normpath(posixpath.join(posixpath.dirname(n),f)) not in names:zipbroken.append([n,x])
r={'local_markdown_broken':broken,'asset_missing':assets,'forbidden_runtime_calls':forbidden,'p0_zip_broken':zipbroken,'originals':report,'result':'PASS' if not(broken or assets or forbidden or zipbroken or changed) else 'FAIL'}
(root/'evidence/p1/package-checks.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));print(json.dumps(r,ensure_ascii=False,indent=2))
