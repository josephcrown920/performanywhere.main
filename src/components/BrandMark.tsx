export default function BrandMark({ size = 36, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img src="/pa-mark.svg" width={size} height={size} alt="Perform Anywhere" style={{ width: size, height: size }} />
      {withText && (
        <span className="flex flex-col leading-none">
          <span className="font-display font-condensed text-[19px] font-black uppercase tracking-[0.02em] text-foreground">Perform Anywhere</span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.3em] text-primary">Powered by Aurora</span>
        </span>
      )}
    </span>
  );
}
