const SKELETON_COUNT = 8;

/** Loading skeleton for the PLP (pulse animation; disabled by reduced-motion). */
export default function ProductsLoading() {
  return (
    <div className="container dv-skel-page" aria-hidden="true">
      <div className="dv-skeleton dv-skel-title" />
      <div className="dv-skeleton dv-skel-bar" />
      <div className="dv-grid">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <div key={index} className="dv-skel-card">
            <div className="dv-skeleton dv-skel-media" />
            <div className="dv-skeleton dv-skel-line" />
            <div className="dv-skeleton dv-skel-line dv-skel-line-short" />
          </div>
        ))}
      </div>
    </div>
  );
}
