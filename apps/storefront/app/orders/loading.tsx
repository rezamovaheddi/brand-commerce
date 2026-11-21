/** Loading skeleton for the order detail page (pulse; disabled by reduced-motion). */
export default function OrderLoading() {
  return (
    <div className="container dv-skel-page" aria-hidden="true">
      <div className="dv-skeleton dv-skel-title" />
      <div className="dv-skeleton dv-skel-bar" />
      <div className="dv-grid">
        <div className="dv-skel-card">
          <div className="dv-skeleton dv-skel-line" />
          <div className="dv-skeleton dv-skel-line dv-skel-line-short" />
        </div>
        <div className="dv-skel-card">
          <div className="dv-skeleton dv-skel-line" />
          <div className="dv-skeleton dv-skel-line dv-skel-line-short" />
        </div>
      </div>
    </div>
  );
}
