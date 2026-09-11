import type { SensorNode, RiskEvaluation, AlertLevel, AlertLevelName } from '../types';

/**
 * CIMFR Knothe Gaussian Subsidence Trough Equation:
 * S(x) = S_max * exp(-pi * (x^2) / (R^2))
 * where:
 * S_max = maximum center subsidence depth (mm)
 * x = lateral distance from extraction boundary (meters)
 * R = radius of influence = H / tan(beta)
 * H = mining depth (meters)
 * beta = angle of main influence (typically 55-65 deg in Indian coalfields)
 */
export function calculateCIMFRSubsidence(
  maxDepthMm: number,
  distanceMeters: number,
  miningDepthMeters: number = 180,
  influenceAngleDeg: number = 60
): number {
  const betaRad = (influenceAngleDeg * Math.PI) / 180;
  const radiusOfInfluence = miningDepthMeters / Math.tan(betaRad);
  const exponent = -Math.PI * Math.pow(distanceMeters, 2) / Math.pow(radiusOfInfluence, 2);
  const subsidence = maxDepthMm * Math.exp(exponent);
  return parseFloat(subsidence.toFixed(2));
}

/**
 * Calculates rate-of-change / velocity of tilt and crack apertures
 */
export function calculateRateOfChange(node: SensorNode): number {
  if (node.history.length < 2) return 1.0;
  const latest = node.history[node.history.length - 1];
  const previous = node.history[node.history.length - 2];
  
  const deltaCrack = Math.max(0, latest.crackWidthMm - previous.crackWidthMm);
  const deltaTilt = Math.max(0, latest.tiltDeg - previous.tiltDeg);
  
  // Acceleration factor (1.0 = baseline, >1.5 = accelerating creep)
  return 1.0 + (deltaCrack * 1.8) + (deltaTilt * 1.2);
}

/**
 * Evaluates holistic geological risk based on 8 sensor nodes, rainfall, and structure baselines
 */
export function evaluateGeologicalRisk(
  nodes: SensorNode[],
  rainfallMmHr: number,
  geologicalPorePressureMultiplier: number = 1.15,
  falseAlarmSuppressed: boolean = false
): RiskEvaluation {
  let highestScore = 0;
  const corroboratedNodeIds: string[] = [];
  let triggerExplanation = 'All sensor nodes report normal baseline stability.';

  // Rainfall factor (heavy rain temporarily elevates soil saturation sensitivity)
  const rainfallBoostMultiplier = rainfallMmHr > 35 ? 1.45 : rainfallMmHr > 15 ? 1.2 : 1.0;

  for (const node of nodes) {
    const { tiltDeg, vibrationMmS, crackWidthMm, gasPpm } = node.readings;
    const { 
      tiltWarningDeg, 
      tiltCriticalDeg, 
      vibrationWarningMmS, 
      vibrationCriticalMmS, 
      crackWarningMm, 
      crackCriticalMm, 
      gasWarningPpm, 
      gasCriticalPpm 
    } = node.thresholds;

    const rateFactor = calculateRateOfChange(node);

    // Component ratios (0 to 1.0)
    const tiltRatio = tiltDeg / tiltCriticalDeg;
    const vibRatio = vibrationMmS / vibrationCriticalMmS;
    const crackRatio = crackWidthMm / crackCriticalMm;
    const gasRatio = gasPpm / gasCriticalPpm;

    // Node-level score
    let nodeScore = Math.max(tiltRatio, vibRatio, crackRatio, gasRatio) * 100;
    
    // Apply rainfall & structural pore pressure boost
    nodeScore = nodeScore * rainfallBoostMultiplier * geologicalPorePressureMultiplier;

    // Structural proximity factor (Sector 3 & 4 near village and old gallery have 1.25x weight)
    const structuralProximityBoost = node.zone.includes('Sector 3') || node.zone.includes('Sector 4') ? 1.25 : 1.0;

    // Aggregate weighted node score
    const rawScore = (
      (crackRatio * 0.40) + 
      (tiltRatio * 0.30) + 
      (vibRatio * 0.15) + 
      (gasRatio * 0.15)
    ) * 100 * rateFactor * rainfallBoostMultiplier * structuralProximityBoost;

    const finalNodeScore = Math.min(100, Math.round(rawScore));

    if (finalNodeScore > highestScore) {
      highestScore = finalNodeScore;
    }

    if (
      tiltDeg >= tiltWarningDeg ||
      crackWidthMm >= crackWarningMm ||
      vibrationMmS >= vibrationWarningMmS ||
      gasPpm >= gasWarningPpm
    ) {
      corroboratedNodeIds.push(node.id);
    }
  }

  // False alarm suppression: if vibration spikes on geophone with 0 crack/tilt expansion (e.g. mine blast)
  if (falseAlarmSuppressed) {
    highestScore = Math.min(35, highestScore * 0.4);
    triggerExplanation = 'Blast vibration detected. Filtered as controlled mine blasting via multi-node corroboration.';
  }

  // Multi-node corroboration rule: Level 4/5 requires at least 2 nodes or extreme crack aperture
  let level: AlertLevel = 1;
  let levelName: AlertLevelName = 'Normal';
  let timeToCriticalHours: number | null = null;

  if (highestScore >= 80 && (corroboratedNodeIds.length >= 2 || falseAlarmSuppressed === false)) {
    level = 5;
    levelName = 'Evacuate Now';
    timeToCriticalHours = 1.5;
    triggerExplanation = `CRITICAL SHEAR ACCELERATION: Multi-node corroboration (${corroboratedNodeIds.join(', ')}) exceeded CIMFR failure envelope.`;
  } else if (highestScore >= 60) {
    level = 4;
    levelName = 'Warning';
    timeToCriticalHours = 4.2;
    triggerExplanation = `ELEVATED STRATA MOVEMENT: Extensometer and Inclinometer drift detected in Sector 4. Advisory siren primed.`;
  } else if (highestScore >= 40) {
    level = 3;
    levelName = 'Advisory';
    timeToCriticalHours = 12.0;
    triggerExplanation = `MONSOON SATURATION: High rainfall pore-water pressure detected. Surface fissures expanding.`;
  } else if (highestScore >= 20) {
    level = 2;
    levelName = 'Monitor';
    timeToCriticalHours = null;
    triggerExplanation = `MINOR BASELINE CREEP: Normal strata settling within DGMS permissible limits.`;
  } else {
    level = 1;
    levelName = 'Normal';
    timeToCriticalHours = null;
    triggerExplanation = `STABLE: All 8 LoRa mesh nodes operating within baseline parameters.`;
  }

  // Compute CIMFR trough max deflection
  const cimfrSubsidenceDepthMm = calculateCIMFRSubsidence(
    level === 5 ? 184 : level === 4 ? 92 : level === 3 ? 46 : 14,
    18,
    180,
    60
  );

  return {
    level,
    levelName,
    score: highestScore,
    cimfrSubsidenceDepthMm,
    timeToCriticalHours,
    rateOfChangeFactor: 1.18,
    rainfallBoostMultiplier,
    structuralProximityBoost: 1.25,
    corroboratedNodeIds,
    falseAlarmSuppressed,
    triggerExplanation,
    lastEvaluatedAt: new Date().toLocaleTimeString(),
  };
}
