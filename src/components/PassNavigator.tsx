interface PassNavigatorProps {
  currentPass: number | null;
  totalPasses: number;
  onChangePass: (pass: number | null) => void;
}

export function PassNavigator({
  currentPass,
  totalPasses,
  onChangePass,
}: PassNavigatorProps) {
  if (totalPasses === 0) return null;

  const handlePrev = () => {
    if (currentPass === null) {
      onChangePass(totalPasses);
    } else if (currentPass > 1) {
      onChangePass(currentPass - 1);
    }
  };

  const handleNext = () => {
    if (currentPass === null) {
      onChangePass(1);
    } else if (currentPass < totalPasses) {
      onChangePass(currentPass + 1);
    }
  };

  return (
    <div className="pass-navigator">
      <button
        className="btn-pass-nav"
        onClick={handlePrev}
        disabled={currentPass !== null && currentPass <= 1}
      >
        &minus;
      </button>
      <button
        className="pass-display"
        onClick={() => onChangePass(currentPass === null ? 1 : null)}
        title={currentPass === null ? "パス追跡を開始" : "パス追跡を解除"}
      >
        {currentPass === null
          ? `パス — / ${totalPasses}`
          : `パス ${currentPass} / ${totalPasses}`}
      </button>
      <button
        className="btn-pass-nav"
        onClick={handleNext}
        disabled={currentPass !== null && currentPass >= totalPasses}
      >
        +
      </button>
    </div>
  );
}
