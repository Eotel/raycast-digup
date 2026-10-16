import {
  Action,
  ActionPanel,
  getApplications,
  getPreferenceValues,
  List,
} from "@raycast/api";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { useEffect, useRef, useState } from "react";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bundleId = "com.abdurrahim.DigUp";

interface Preferences {
  appPath?: string;
  indexPath?: string;
  modelsPath?: string;
}

interface Hit {
  path: string;
  kind: string;
  segment_id: number;
  excerpt?: string;
}

const preferences = getPreferenceValues<Preferences>();

async function search(query: string): Promise<Hit[]> {
  const appPath =
    preferences.appPath?.trim() ||
    (await getApplications()).find((app) => app.bundleId === bundleId)?.path;
  if (!appPath)
    throw new Error("DigUp app not found. Set DigUp App Path in preferences.");

  const cliPath = join(appPath, "Contents", "Helpers", "digup");
  if (!existsSync(cliPath))
    throw new Error("DigUp search helper not found in the app.");

  const args = ["search", query, "--json", "-n", "20"];
  const indexPath = preferences.indexPath?.trim();
  if (indexPath) args.push("--index", indexPath);
  const modelsPath = preferences.modelsPath?.trim();
  const env = modelsPath
    ? { ...process.env, DIGUP_MODELS: modelsPath }
    : process.env;
  const { stdout } = await execFileAsync(cliPath, args, {
    env,
    maxBuffer: 4 * 1024 * 1024,
    timeout: 30_000,
  });
  const rows: unknown = JSON.parse(stdout);
  if (!Array.isArray(rows))
    throw new Error("DigUp returned an invalid search result.");
  return rows.filter(
    (row): row is Hit =>
      typeof row === "object" &&
      row !== null &&
      typeof row.path === "string" &&
      typeof row.kind === "string" &&
      typeof row.segment_id === "number" &&
      existsSync(row.path),
  );
}

export default function Command() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const currentQuery = useRef("");
  const pendingQuery = useRef<string | null>(null);
  const running = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function runPending() {
    if (running.current) return;
    running.current = true;
    while (pendingQuery.current !== null && mounted.current) {
      const next = pendingQuery.current;
      pendingQuery.current = null;
      if (!next) continue;
      try {
        const results = await search(next);
        if (mounted.current && currentQuery.current === next) {
          setHits(results);
          setError(undefined);
        }
      } catch (cause) {
        if (mounted.current && currentQuery.current === next) {
          setHits([]);
          setError(cause instanceof Error ? cause.message : "Search failed.");
        }
      }
    }
    running.current = false;
    if (mounted.current) setLoading(false);
  }

  function onSearchTextChange(text: string) {
    setQuery(text);
    const trimmed = text.trim();
    currentQuery.current = trimmed;
    pendingQuery.current = trimmed || null;
    setHits([]);
    setError(undefined);
    setLoading(Boolean(trimmed));
    if (trimmed) void runPending();
  }

  return (
    <List
      filtering={false}
      isLoading={loading}
      onSearchTextChange={onSearchTextChange}
      searchText={query}
      searchBarPlaceholder="Search DigUp"
      throttle
    >
      {hits.length === 0 ? (
        <List.EmptyView
          title={
            loading
              ? "Searching…"
              : error || (query.trim() ? "No results" : "Search indexed files")
          }
        />
      ) : null}
      {hits.map((hit) => (
        <List.Item
          key={`${hit.path}:${hit.segment_id}`}
          title={basename(hit.path)}
          subtitle={hit.excerpt || dirname(hit.path)}
          accessories={[{ text: hit.kind, tooltip: dirname(hit.path) }]}
          actions={
            <ActionPanel>
              <Action.Open title="Open File" target={hit.path} />
              <Action.ShowInFinder path={hit.path} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
