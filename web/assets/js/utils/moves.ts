import {Category, Promotion} from '../types/types.ts';

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

/**
 * Prepares the category parameter for the leaderboard
 * @param {Category} category the requested category
 */
export const prepareCategory = (category: Category): string => {
  switch (category) {
    case Category.RAPID:
      return 'rapid';
    case Category.BLITZ:
      return 'blitz';
    default:
      return 'correspondence';
  }
};
