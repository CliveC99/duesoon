import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("mobile navigation is isolated from page stacking contexts", async () => {
  const [component, css] = await Promise.all([
    readFile(new URL("../app/components/mobile-navigation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(component, /createPortal\([\s\S]*document\.body/);
  assert.match(component, /className="mobile-navigation-backdrop"/);
  assert.match(component, /href=\{item\.href\}[\s\S]*onClick=\{\(\) => setOpen\(false\)\}/);
  assert.match(css, /\.mobile-navigation-layer \{ position:fixed; inset:0; z-index:var\(--layer-navigation\); \}/);
  assert.match(css, /\.mobile-navigation-backdrop \{ position:absolute; inset:0;/);
  assert.match(css, /right:calc\(14px \+ env\(safe-area-inset-right\)\)/);
});
