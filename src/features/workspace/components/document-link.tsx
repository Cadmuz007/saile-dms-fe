"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DocumentLink({ documentId }: { documentId: string }) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  return <>
    <Button variant="secondary" onClick={() => { const link = new URL("/", window.location.origin); link.searchParams.set("document", documentId); setUrl(link.href); setMessage(""); }}>Generate Link</Button>
    <Dialog open={Boolean(url)} onOpenChange={(open) => { if (!open) setUrl(""); }}>
      <DialogContent><DialogHeader><DialogTitle>Document link</DialogTitle><DialogDescription>Recipients must sign in and already have access. This link does not grant access or bypass Document Type visibility.</DialogDescription></DialogHeader>
        <label className="grid gap-2 text-sm">Link<input className="w-full rounded-md border p-2" readOnly value={url} onFocus={(event) => event.target.select()} /></label>
        <Button onClick={async () => { try { await navigator.clipboard.writeText(url); setMessage("Link copied."); } catch { setMessage("Copy is unavailable. Select and copy the link above."); } }}>Copy link</Button>
        <p role="status" className="text-sm">{message}</p>
      </DialogContent>
    </Dialog>
  </>;
}
