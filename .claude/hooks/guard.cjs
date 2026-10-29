"use strict";
// AI Company v7: built-in file tools only. This hook never writes files or makes network calls.
const fs = require("node:fs");
const path = require("node:path");
const inputText = fs.readFileSync(0, "utf8");
function block(why) { process.stderr.write("AI-COMPANY DENIED: " + why + "\n"); process.exit(2); }
// An unexpected crash would exit 1, which Claude Code treats as non-blocking; deny instead.
process.on('uncaughtException', (e) => block('guard error: ' + (e && e.message)));
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
// Each employee may only create new files of its own kind, named after an existing request ID.
const ID="([A-Z0-9][A-Z0-9-]{0,40})";
const ROLES={
  'office-intake':   new RegExp('^workspace/01-intake/JOB-'+ID+'\\.md$'),
  'office-research': new RegExp('^workspace/02-research/RES-'+ID+'\\.md$'),
  'office-writer':   new RegExp('^workspace/03-drafts/DRAFT-'+ID+'(?:-r2)?\\.md$'),
  'office-auditor':  new RegExp('^workspace/04-audit/AUDIT-'+ID+'(?:-r2)?\\.md$'),
  'office-records':  new RegExp('^workspace/05-records/LOG-'+ID+'\\.md$'),
};
if (tool==='Agent') {
  // Only the top-level dispatcher may launch the five employees; never nested agents.
  if (actor) block('nested agents forbidden');
  if (!Object.prototype.hasOwnProperty.call(ROLES, ti.subagent_type)) block('unknown employee');
  // Some Claude Code builds have no run_in_background field; reject only an explicit background request.
  if (ti.run_in_background === true) block('background execution forbidden');
  process.exit(0);
}
if (tool==='Edit') block('edits to existing files forbidden');
if (tool==='Write') {
  const r=relfile(ti.file_path);
  const role=Object.prototype.hasOwnProperty.call(ROLES, actor) ? ROLES[actor] : null;
  const m=role && role.exec(r);
  if (!m) block('role or target mismatch');
  // Every output must belong to a request the chairman actually filed.
  if (!fs.existsSync(path.join(root,'workspace','00-requests','JOB-'+m[1]+'.md'))) block('no matching request');
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
