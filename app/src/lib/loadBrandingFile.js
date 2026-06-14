import fs from 'fs';
import path from 'path';

// Module-level cache: holds the branding file after the first SUCCESSFUL read.
// A failed read is NOT cached for an operator-configured TENANT_BRANDING_FILE, so a
// transient/early miss (e.g. the branding volume not yet visible to this module's
// first caller) self-heals on a later call instead of latching null for the whole
// process lifetime. Only a default-path miss (no tenant branding configured) is cached.
let _loaded = false;
let _value = null;

const DEFAULT_BRANDING_PATH = 'branding/default/theme.json';

export default function loadBrandingFile() {
  if (_loaded) return _value;

  const filePath = process.env.TENANT_BRANDING_FILE || DEFAULT_BRANDING_PATH;
  const isDefault = filePath === DEFAULT_BRANDING_PATH;

  try {
    const resolvedPath = filePath.startsWith('/') ? filePath : path.join(process.cwd(), 'public', filePath);
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    _value = JSON.parse(raw);
    _loaded = true; // cache only a successful read
    return _value;
  } catch (err) {
    // ENOENT on the default path is expected — the default theme.json was
    // intentionally removed. Surface that at info level; operator-configured paths
    // and any non-ENOENT error (parse failure, permission, etc.) log loud because
    // those signal real misconfiguration.
    if (err && err.code === 'ENOENT' && isDefault) {
      console.info('No branding file found at default path; using fallbacks.');
    } else {
      console.error('Failed to load branding file:', err.message);
    }
    // Cache the miss only for the default path, where absence is the steady state.
    // For an operator-configured TENANT_BRANDING_FILE, leave _loaded=false so a later
    // render retries instead of latching null for the whole process lifetime — the
    // root cause of the SSR default-branding flash (bee favicon / color FOUC).
    if (isDefault) _loaded = true;
    return _value;
  }
}
