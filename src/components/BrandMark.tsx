export default function BrandMark({ size = 36, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img src="/pa-mark.svg" width={size} height={size} alt="Perform Anywhere" style={{ width: size, height: size }} />
      {withText && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl tracking-wide text-foreground">PERFORM ANYWHERE</span>
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.3em] text-primary">Powered by Aurora</span>
        </span>
      )}
    </span>
  );
}
