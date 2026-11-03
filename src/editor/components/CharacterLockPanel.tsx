import { useEffect, useState } from "react";
import { UserRoundCheck, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MAX_CHARACTER_REFS, readCharacterLock, saveCharacterLock, type CharacterLock } from "@/lib/character-lock";

export function useCharacterLock(): [CharacterLock, (l: CharacterLock) => void] {
  const [lock, setLock] = useState<CharacterLock>({ on: false, name: "", notes: "", refs: [] });
  useEffect(() => {
    const sync = () => setLock(readCharacterLock());
    sync();
    window.addEventListener("character-lock", sync);
    return () => window.removeEventListener("character-lock", sync);
  }, []);
  return [lock, (l) => { setLock(l); saveCharacterLock(l); }];
}

/** Locks one character's photos + identity notes onto every image and video generation. */
export function CharacterLockPanel() {
  const [lock, update] = useCharacterLock();
  return (
    <section aria-label="Character lock" className="space-y-2 rounded-md border border-border glass-control p-2">
      <div className="flex items-center gap-2">
        <UserRoundCheck className="size-3.5 text-primary" />
        <p className="flex-1 text-xs font-semibold">Character lock</p>
        <Switch checked={lock.on} onCheckedChange={(on) => update({ ...lock, on })} aria-label="Use character lock on every generation" />
      </div>
      <p className="text-[10px] text-muted-foreground">Tap the person icon on up to {MAX_CHARACTER_REFS} photos below. They're sent with every image and video so the face, hair and tattoos stay the same.</p>
      {lock.refs.length > 0 && (
        <div className="flex gap-1.5">
          {lock.refs.map((r) => (
            <div key={r.id} className="relative">
              <img src={r.url} alt="" className="size-12 rounded object-cover" />
              <Button variant="secondary" size="icon" className="absolute -top-1 -right-1 size-4 rounded-full" aria-label="Remove reference" onClick={() => update({ ...lock, refs: lock.refs.filter((x) => x.id !== r.id) })}><X className="size-2.5" /></Button>
            </div>
          ))}
        </div>
      )}
      <Input value={lock.name} onChange={(e) => update({ ...lock, name: e.target.value })} placeholder="Name (e.g. Josh)" className="h-7 text-xs" />
      <Textarea value={lock.notes} onChange={(e) => update({ ...lock, notes: e.target.value })} placeholder="Exact details: which arm each tattoo is on, hair colour, scars, jewellery…" className="min-h-16 text-xs" />
    </section>
  );
}
