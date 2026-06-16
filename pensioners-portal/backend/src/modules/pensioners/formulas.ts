export const FORMULA_RATES = {
  commissionRate: 0.18,
  vatRate: 0.14,
  adminFeeRate: 0.22,
  collectionFeeRate: 0.02,
  whtRate: 0.10
} as const;

export interface FeeBreakdown {
  paid_amount: number;
  commission: number;
  admin_fee: number;
  collection_fee: number;
  net_premium: number;
  wht: number;
  bona_life: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateFees(paidAmount: number): FeeBreakdown {
  const paid = Number(paidAmount) || 0;
  const commissionBase = paid * FORMULA_RATES.commissionRate;
  const commissionVat = commissionBase * FORMULA_RATES.vatRate;
  const commission = round2(commissionBase + commissionVat);
  const admin_fee = round2(paid * FORMULA_RATES.adminFeeRate);
  const collection_fee = round2(paid * FORMULA_RATES.collectionFeeRate);
  const net_premium = round2(paid - commission - admin_fee - collection_fee);
  const wht = round2(net_premium * FORMULA_RATES.whtRate);
  const bona_life = round2(net_premium + wht);

  return {
    paid_amount: round2(paid),
    commission,
    admin_fee,
    collection_fee,
    net_premium,
    wht,
    bona_life
  };
}

export function getFormulaConfig() {
  return {
    commission: `${FORMULA_RATES.commissionRate * 100}% + VAT ${FORMULA_RATES.vatRate * 100}%`,
    admin_fee: `${FORMULA_RATES.adminFeeRate * 100}%`,
    collection_fee: `${FORMULA_RATES.collectionFeeRate * 100}%`,
    wht: `${FORMULA_RATES.whtRate * 100}% of net premium`,
    bona_life: 'net_premium + wht',
    rates: { ...FORMULA_RATES }
  };
}
