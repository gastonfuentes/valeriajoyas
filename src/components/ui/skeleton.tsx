/** Whisper-quiet placeholder block. Server-safe (no hooks). */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}
