/* eslint-disable @next/next/no-img-element */

export const Logo = ({ imgSize, textSize }: { imgSize?: string, textSize?: string }) => {
  return (
    <div className="flex items-center gap-2">
      <img src="/logo.png" alt="Site Logo" className={`rounded-lg ${imgSize}`} />
      <span className={`font-bold text-foreground ${textSize}`}>
        Facevaly
      </span>
    </div>
  )
}
