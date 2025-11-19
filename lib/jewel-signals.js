const FIB_LEVELS = [0, 23.6, 38.2, 50, 61.8, 76.4, 100];

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function classifyBbwp(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  if (value < 20) return "Extreme Low";
  if (value < 40) return "Low";
  if (value < 70) return "Normal";
  if (value < 85) return "High";
  return "Extreme High";
}

function classifyFibZone(center) {
  if (typeof center !== "number" || Number.isNaN(center)) return null;
  if (center < 25) return "🔥 Extreme Low";
  if (center < 40) return "⬇️ Low";
  if (center > 80) return "🔥 Extreme High";
  if (center > 60) return "⬆️ High";
  return "○ Mid";
}

function compressionScore(range) {
  if (typeof range !== "number" || Number.isNaN(range)) return 0;
  if (range <= 2) return 40;
  if (range <= 4) return 35;
  if (range <= 6) return 30;
  if (range <= 10) return 20;
  if (range <= 15) return 10;
  return 0;
}

function slopeContribution(slope) {
  if (typeof slope !== "number" || Number.isNaN(slope)) return { buy: 0, sell: 0 };
  if (slope > 2) return { buy: 20, sell: 0 };
  if (slope > 1) return { buy: 15, sell: 0 };
  if (slope > 0.5) return { buy: 10, sell: 0 };
  if (slope > 0) return { buy: 5, sell: 0 };
  if (slope < -2) return { buy: 0, sell: 20 };
  if (slope < -1) return { buy: 0, sell: 15 };
  if (slope < -0.5) return { buy: 0, sell: 10 };
  if (slope < 0) return { buy: 0, sell: 5 };
  return { buy: 0, sell: 0 };
}

function nearestFib(center) {
  if (typeof center !== "number" || Number.isNaN(center)) return 50;
  let nearest = 50;
  let dist = Infinity;
  for (const level of FIB_LEVELS) {
    const delta = Math.abs(center - level);
    if (delta < dist) {
      dist = delta;
      nearest = level;
    }
  }
  return nearest;
}

function computeJewelSignals(input) {
  const fast = toNumber(input.fast);
  const slow = toNumber(input.slow);
  const high = toNumber(input.high);
  const fib = toNumber(input.fib);
  const bbwpValue = toNumber(input.bbwp);
  const fibCutting =
    typeof fast === "number" &&
    typeof slow === "number" &&
    typeof high === "number" &&
    typeof fib === "number" &&
    fib > Math.min(fast, slow, high) &&
    fib < Math.max(fast, slow, high);

  if (
    fast === null ||
    slow === null ||
    high === null ||
    typeof fast !== "number" ||
    typeof slow !== "number" ||
    typeof high !== "number"
  ) {
    return {
      compressionTotalRange: null,
      compressionCenter: null,
      compressionFibZone: null,
      nearestFibLevel: fib,
      buyScore: null,
      sellScore: null,
      signalType: input.signalType || null,
      signalStrength: input.signalStrength || null,
      fibCutting: fibCutting || false,
      bbwpValue,
      bbwpClassification: classifyBbwp(bbwpValue),
      extremeCompression: null,
      perfectSetup: null,
    };
  }

  const totalRange = Math.max(fast, slow, high) - Math.min(fast, slow, high);
  const center = (fast + slow + high) / 3;
  const fibZone = classifyFibZone(center);
  const extremeCompression = totalRange <= 4;
  const perfectSetup = extremeCompression && center < 30;

  let buyScore = 0;
  let sellScore = 0;

  const compScore = compressionScore(totalRange);
  buyScore += compScore;
  sellScore += compScore;

  if (center < 25) {
    buyScore += 30;
  } else if (center < 40) {
    buyScore += 25;
  } else if (center > 75) {
    sellScore += 30;
  } else if (center > 60) {
    sellScore += 25;
  }

  const slopeFast = toNumber(input.slopeFast);
  const slopeContributionResult = slopeContribution(slopeFast);
  buyScore += slopeContributionResult.buy;
  sellScore += slopeContributionResult.sell;

  if (fibCutting) {
    buyScore += 10;
    sellScore += 10;
  }

  let signalType = null;
  let signalStrength = null;
  if (buyScore > sellScore) {
    if (buyScore >= 80) {
      signalType = "GOD_BUY";
      signalStrength = 5;
    } else if (buyScore >= 65) {
      signalType = "ULTRA_BUY";
      signalStrength = 4;
    } else if (buyScore >= 50) {
      signalType = "STRONG_BUY";
      signalStrength = 3;
    } else if (buyScore >= 30) {
      signalType = "BUY";
      signalStrength = 2;
    }
  } else if (sellScore > buyScore) {
    if (sellScore >= 80) {
      signalType = "GOD_SELL";
      signalStrength = 5;
    } else if (sellScore >= 65) {
      signalType = "ULTRA_SELL";
      signalStrength = 4;
    } else if (sellScore >= 50) {
      signalType = "STRONG_SELL";
      signalStrength = 3;
    } else if (sellScore >= 30) {
      signalType = "SELL";
      signalStrength = 2;
    }
  } else if (buyScore > 0) {
    signalType = null;
    signalStrength = null;
  }

  if (!signalType && input.signalType) {
    signalType = input.signalType;
    signalStrength = input.signalStrength || null;
  }

  return {
    compressionTotalRange: totalRange,
    compressionCenter: center,
    compressionFibZone: fibZone,
    nearestFibLevel: nearestFib(center),
    buyScore,
    sellScore,
    signalType,
    signalStrength,
    fibCutting: !!fibCutting,
    bbwpValue,
    bbwpClassification: classifyBbwp(bbwpValue),
    extremeCompression,
    perfectSetup,
  };
}

module.exports = {
  computeJewelSignals,
  classifyBbwp,
  classifyFibZone,
};
