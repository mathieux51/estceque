const EMBED =
  'https://framacarte.org/fr/map/l-oreille-voyageuse_239008?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=true&editMode=disabled&moreControl=true&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false#3/25.244696/-19.160156'

/** The "L'oreille voyageuse" map from Framacarte. */
export default function MapEmbed({ height = 480 }: { height?: number }) {
  return (
    <iframe
      title="Carte sonore L'oreille voyageuse (Framacarte)"
      src={EMBED}
      loading='lazy'
      width='100%'
      height={height}
      className='w-full rounded-lg border border-grey/40'
      allowFullScreen
    />
  )
}
