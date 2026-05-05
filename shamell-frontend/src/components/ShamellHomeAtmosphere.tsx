/** Fixed ambient gradient layers behind home content. */
export default function ShamellHomeAtmosphere() {
  return (
    <div className="shamell-home__atmosphere" aria-hidden>
      <div className="absolute inset-0">
        <div className="shamell-home__gradient-aurora" />
        <div className="shamell-home__gradient-dusk" />
        <div className="shamell-home__blob shamell-home__blob--warm" />
        <div className="shamell-home__blob shamell-home__blob--cool" />
        <div className="shamell-home__blob shamell-home__blob--gold" />
        <div className="shamell-home__sheen" />
      </div>
      <div className="shamell-home__atmosphere-vignette" />
    </div>
  );
}
