import type { FesaGrade, FesaGradeInfo } from "./types.js";

const MIDPOINTS: Record<FesaGrade, number> = {
  "5_DAN": 2340,
  "4_DAN": 2160,
  "3_DAN": 2000,
  "2_DAN": 1860,
  "1_DAN": 1740,
  "1_KYU": 1620,
  "2_KYU": 1510,
  "3_KYU": 1410,
  "4_KYU": 1320,
  "5_KYU": 1240,
  "6_KYU": 1160,
  "7_KYU": 1080,
  "8_KYU": 1000,
  "9_KYU": 920,
  "10_KYU": 840,
  "11_KYU": 760,
  "12_KYU": 680,
  "13_KYU": 600,
  "14_KYU": 520,
  "15_KYU": 440,
  "16_KYU": 360,
  "17_KYU": 280,
  "18_KYU": 200,
  "19_KYU": 120,
  "20_KYU": 40,
};

export function getGradeInfo(grade: FesaGrade): FesaGradeInfo {
  return { midpoint: MIDPOINTS[grade] };
}
