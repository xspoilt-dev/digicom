/* eslint-disable @next/next/no-img-element */

export const Logo = ({ imgSize, textSize }: { imgSize?: string, textSize?: string }) => {
  return (
    <div className="flex items-center gap-2">
      <span className={`font-extrabold tracking-tighter text-primary ${textSize || 'text-3xl'}`}>
        DigiCom
      </span>
    </div>
  )
}
