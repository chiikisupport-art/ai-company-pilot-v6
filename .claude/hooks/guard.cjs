"use strict";
// AI Company Pilot v5: built-in file tools only. This hook never writes files or makes network calls.
const fs = require("node:fs");
const path = require("node:path");
const inputText = fs.readFileSync(0, "utf8");
function block(why) { process.stderr.write("AI-COMPANY DENIED: " + why + "\n"); process.exit(2); }
let evt;
try { evt = JSON.parse(inputText); } catch { block("invalid hook input"); }
const rootEnv = process.env.CLAUDE_PROJECT_DIR;
if (!rootEnv) block("CLAUDE_PROJECT_DIR missing");
let root;
try { root = fs.realpathSync(rootEnv); } catch { block("project folder missing"); }
const cwd=evt.cwd;
if (typeof cwd !== "string") block("cwd missing");
function relfile(file) {
  if (typeof file !== 'string' || !file) block('missing file path');
  const resolved=path.resolve(cwd, file);
  const rel=path.relative(root,resolved).split(path.sep).join('/');
  if (!rel || rel==='..' || rel.startsWith('../') || path.isAbsolute(rel)) block('path outside project');
  // Reject symlink in every existing path component and reject symbolic path aliases.
  let cursor=root;
  for(const seg of rel.split('/')) {
    cursor=path.join(cursor,seg);
    try { if(fs.lstatSync(cursor).isSymbolicLink()) block('symlink path forbidden'); }
    catch(e) { if (e?.code !== 'ENOENT') throw e; }
  }
  return rel;
}
function readpath(val) {
  let f=val || root;
  const rel=path.relative(root,path.resolve(cwd,f)).split(path.sep).join('/');
  if (rel==='') return;
  relfile(f);
}
const tool=evt.tool_name;
const ti=evt.tool_input;
if (!ti || typeof ti!=="object") block('missing tool input');
const actor=evt.agent_type || '';
if (tool==='Agent') {
  // Top-level dispatcher can launch only the two named employees; never nested agents.
  if (actor) block('nested agents forbidden');
  if (!['office-intake','office-writer'].includes(ti.subagent_type)) block('employee inactive');
  // Some Claude Code builds have no run_in_background field; reject only an explicit background request.
  if (ti.run_in_background === true) block('background execution forbidden');
  process.exit(0);
}
if (tool==='Edit') block('edits to existing files forbidden');
if (tool==='Write') {
  const r=relfile(ti.file_path);
  const targets={'office-intake':'workspace/01-intake/JOB-TEST-001.md', 'office-writer':'workspace/03-drafts/DRAFT-TEST-001.md'};
  if (!targets[actor] || targets[actor]!==r) block('role or target mismatch');
  if (typeof ti.content!=='string' || !ti.content.trim()) block('empty content');
  if (Buffer.byteLength(ti.content,'utf8')>40000) block('draft exceeds 40KB limit');
  if (fs.existsSync(path.resolve(root,r))) block('create-only: file already exists');
  process.exit(0);
}
if (tool==='Read') { readpath(ti.file_path); process.exit(0); }
if (tool==='Grep' || tool==='Glob') {
  readpath(ti.path);
  // Deny patterns escaping project or containing absolute paths.
  if (tool==='Glob' && typeof ti.pattern==='string') {
    const p=ti.pattern.replace(/\\/g,'/');
    if(p.startsWith('/') || /(^|\/)\.\.($|\/)/.test(p)) block('glob escape');
  }
  process.exit(0);
}
block('unexpected tool');
