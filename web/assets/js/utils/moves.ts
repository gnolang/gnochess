import {Promotion} from '../types/types.ts';

/**
 * Prepares the promotion parameter
 * @param {Promotion} promotion the requested promotion
 */
export const preparePromotion = (promotion: Promotion): string => {
  switch (promotion) {
    case Promotion.ROOK:
      return '2';
    case Promotion.KNIGHT:
      return '3';
    case Promotion.BISHOP:
      return '4';
    case Promotion.QUEEN:
      return '5';
    default:
      return '0';
  }
};
