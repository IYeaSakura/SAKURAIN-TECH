'use client';

/**
 * TravelMap —— interactive China map showing visited and current cities.
 *
 * The map path is generated from a simplified national GeoJSON. City
 * coordinates are projected to SVG space using the same bounds as the
 * generator script so markers align with the map silhouette.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation } from 'lucide-react';
import { useTranslation, useAnimationEnabled } from '@/hooks';

interface City {
  name: string;
  coordinates: [number, number];
}

interface CityData {
  current: City;
  visited: City[];
}

const MAP_BOUNDS = {
  minLon: 73.502355,
  maxLon: 135.09567,
  minLat: 3.39716187,
  maxLat: 53.563269,
};

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 800;

const CHINA_PATH_D =
  'M 711.9 207.0 L 700.5 199.4 L 695.5 201.5 L 686.0 207.7 L 689.5 212.1 L 681.1 215.8 L 681.5 221.9 L 702.8 222.7 L 702.7 215.7 L 711.9 214.1 L 711.9 207.0 Z M 718.6 225.9 L 721.4 223.1 L 714.5 217.9 L 718.8 215.3 L 713.0 212.3 L 709.1 222.0 L 703.2 222.4 L 702.1 236.2 L 718.0 237.3 L 723.5 228.6 L 718.6 225.9 Z M 713.8 205.9 L 709.9 210.4 L 718.8 215.3 L 714.6 217.1 L 716.6 222.6 L 730.4 233.7 L 752.8 216.9 L 747.8 207.6 L 736.2 203.2 L 742.6 195.3 L 728.1 194.9 L 727.3 183.5 L 719.2 174.6 L 679.9 190.7 L 671.5 190.8 L 670.4 182.0 L 660.8 187.7 L 654.6 198.8 L 666.1 210.8 L 656.0 216.0 L 666.7 223.1 L 650.4 239.3 L 659.8 253.4 L 650.8 272.7 L 679.7 278.5 L 678.2 272.1 L 689.6 258.8 L 718.7 246.0 L 721.8 242.2 L 716.6 238.2 L 702.1 236.2 L 703.2 222.4 L 680.9 220.2 L 689.5 212.1 L 686.0 207.7 L 700.0 199.5 L 713.8 205.9 Z M 598.7 302.4 L 651.4 285.9 L 648.8 268.8 L 659.8 253.4 L 650.4 239.3 L 666.7 223.1 L 656.0 216.0 L 666.1 210.8 L 659.7 204.5 L 650.4 210.7 L 630.1 212.2 L 624.0 222.3 L 611.1 225.7 L 600.8 245.1 L 605.5 255.2 L 598.8 263.8 L 602.5 285.9 L 598.7 302.4 Z M 384.3 171.7 L 395.2 189.9 L 391.7 193.3 L 403.3 207.2 L 432.0 202.3 L 433.0 211.9 L 421.1 218.1 L 443.9 225.8 L 445.9 233.1 L 459.1 237.7 L 463.9 234.0 L 461.1 230.5 L 496.6 225.5 L 498.3 232.4 L 484.8 247.6 L 498.1 257.7 L 523.7 251.4 L 527.1 233.7 L 537.4 226.3 L 543.4 231.8 L 535.4 243.1 L 560.5 253.8 L 572.7 253.2 L 577.2 241.3 L 595.0 225.0 L 614.3 225.5 L 624.0 222.3 L 630.1 212.2 L 658.5 207.9 L 655.4 193.8 L 666.6 182.3 L 677.0 191.2 L 702.9 184.8 L 704.9 178.0 L 718.9 174.5 L 727.3 183.5 L 728.6 195.4 L 741.9 195.8 L 746.8 178.2 L 756.5 189.2 L 786.4 173.4 L 812.9 168.4 L 809.9 149.9 L 805.6 144.4 L 791.8 148.4 L 791.3 132.2 L 781.6 124.6 L 784.8 120.2 L 799.4 125.3 L 806.5 116.7 L 803.7 111.4 L 813.4 109.6 L 808.5 104.7 L 803.7 109.0 L 794.2 99.1 L 824.1 80.2 L 828.5 86.4 L 833.0 70.9 L 839.7 69.8 L 840.3 55.2 L 853.3 40.2 L 838.2 30.4 L 826.5 36.5 L 803.7 35.9 L 800.2 20.9 L 790.1 16.7 L 782.7 19.9 L 774.1 15.4 L 783.9 8.7 L 782.2 5.1 L 768.2 4.7 L 755.4 12.6 L 766.8 16.4 L 767.7 22.4 L 740.7 50.6 L 744.4 54.2 L 719.3 64.5 L 701.6 59.3 L 682.3 86.2 L 689.0 93.8 L 731.7 88.8 L 750.3 101.5 L 753.5 109.9 L 713.0 111.3 L 699.5 115.9 L 692.8 125.6 L 666.4 130.4 L 651.5 140.6 L 623.5 135.7 L 615.5 146.8 L 624.2 157.4 L 585.2 176.9 L 551.4 177.1 L 511.5 191.0 L 444.2 173.7 L 384.3 171.7 Z M 812.3 219.7 L 822.3 220.4 L 847.2 204.0 L 848.9 197.7 L 840.9 187.2 L 844.0 182.2 L 834.2 166.3 L 827.4 170.9 L 816.6 160.6 L 807.3 171.1 L 786.4 173.4 L 756.5 189.2 L 752.3 181.0 L 742.5 181.2 L 745.2 192.8 L 736.2 203.2 L 747.8 207.6 L 752.5 216.5 L 773.2 202.4 L 784.4 202.0 L 791.4 208.0 L 774.8 223.4 L 782.9 226.4 L 773.4 236.7 L 812.3 219.7 Z M 910.8 177.8 L 915.6 168.4 L 927.7 177.6 L 923.9 172.7 L 935.9 169.5 L 938.7 160.5 L 924.0 158.0 L 923.2 151.8 L 899.1 159.8 L 890.8 144.3 L 881.3 151.4 L 877.6 143.3 L 869.4 143.5 L 868.0 134.5 L 852.3 134.0 L 847.3 128.4 L 826.3 129.5 L 818.2 115.8 L 800.3 119.4 L 799.4 125.3 L 784.8 120.2 L 781.6 124.6 L 791.3 132.2 L 791.8 148.4 L 805.6 144.4 L 810.4 161.9 L 817.5 161.1 L 827.4 170.9 L 834.2 166.3 L 844.0 182.2 L 841.2 189.6 L 848.9 197.7 L 845.6 202.1 L 853.0 201.5 L 867.4 187.4 L 886.7 194.5 L 890.0 191.2 L 885.3 184.4 L 910.8 177.8 Z M 812.9 117.0 L 819.2 116.0 L 826.3 129.5 L 847.3 128.4 L 852.3 134.0 L 868.0 134.5 L 869.4 143.5 L 877.6 143.3 L 881.3 151.4 L 890.8 144.3 L 899.1 159.8 L 923.2 151.8 L 924.0 158.0 L 935.8 161.7 L 938.5 151.8 L 932.9 138.9 L 947.9 131.1 L 968.2 134.5 L 985.1 99.5 L 994.9 93.2 L 993.2 84.6 L 1000.0 81.7 L 968.1 86.6 L 958.8 93.2 L 934.0 93.6 L 928.1 87.0 L 928.3 74.7 L 877.2 59.6 L 878.4 53.0 L 861.4 22.8 L 846.1 7.6 L 812.0 0.1 L 782.5 2.7 L 784.4 8.0 L 774.1 15.4 L 800.2 20.9 L 803.7 35.9 L 826.5 36.5 L 838.2 30.4 L 853.3 40.2 L 840.3 55.2 L 839.7 69.8 L 833.0 70.9 L 828.5 86.4 L 824.1 80.2 L 794.2 99.1 L 804.0 109.1 L 813.4 106.4 L 803.7 111.4 L 812.9 117.0 Z M 769.5 359.5 L 775.6 365.0 L 787.3 362.0 L 776.7 351.7 L 769.5 359.5 Z M 711.3 303.0 L 702.8 296.4 L 696.0 301.8 L 725.1 316.2 L 721.5 324.3 L 727.3 331.4 L 741.7 330.7 L 740.1 336.7 L 731.7 334.5 L 728.8 342.7 L 736.4 349.9 L 735.3 356.2 L 753.6 357.1 L 763.1 363.7 L 777.2 351.0 L 774.4 346.5 L 787.0 350.0 L 770.5 334.1 L 760.0 307.1 L 742.5 299.2 L 743.3 294.2 L 728.6 305.4 L 711.3 303.0 Z M 729.5 403.1 L 735.5 403.8 L 737.2 416.3 L 748.5 412.8 L 751.2 418.7 L 763.8 421.1 L 767.5 411.2 L 774.3 410.5 L 772.1 406.1 L 781.3 403.6 L 781.0 389.0 L 786.8 390.9 L 784.7 381.3 L 789.7 377.3 L 772.7 367.5 L 775.6 364.2 L 771.0 359.6 L 763.1 363.7 L 749.7 357.1 L 742.6 366.0 L 745.2 369.8 L 736.7 370.7 L 734.5 379.9 L 723.1 388.4 L 729.5 403.1 Z M 699.7 311.7 L 692.5 316.6 L 684.4 311.0 L 678.4 325.8 L 672.2 325.9 L 677.0 334.4 L 688.5 334.8 L 688.6 346.8 L 679.8 354.2 L 690.9 359.6 L 686.1 364.8 L 692.2 378.6 L 700.8 374.5 L 704.6 376.6 L 701.7 382.7 L 709.7 376.9 L 727.6 385.0 L 736.7 370.7 L 745.2 369.8 L 742.6 366.0 L 749.0 359.5 L 735.3 356.2 L 736.4 349.9 L 728.3 345.0 L 731.7 334.5 L 740.1 336.7 L 741.7 330.7 L 728.5 332.4 L 721.5 324.3 L 725.1 316.2 L 697.0 301.6 L 692.6 304.6 L 699.7 311.7 Z M 738.8 456.0 L 737.3 451.4 L 740.6 455.3 L 744.9 451.5 L 742.2 448.0 L 752.7 448.2 L 746.4 445.4 L 754.2 433.9 L 748.1 429.6 L 757.2 429.4 L 761.9 419.5 L 751.2 418.7 L 748.5 412.8 L 737.2 416.3 L 734.1 402.7 L 710.8 409.7 L 687.9 456.1 L 703.2 461.0 L 711.1 478.6 L 724.4 462.4 L 732.4 463.1 L 738.8 456.0 Z M 725.6 385.4 L 709.7 376.9 L 701.7 382.7 L 704.6 376.6 L 700.8 374.5 L 656.7 390.2 L 661.6 402.6 L 650.7 414.9 L 659.3 430.5 L 656.9 437.1 L 661.4 437.1 L 656.6 448.5 L 669.6 451.1 L 660.6 461.0 L 687.4 462.5 L 698.9 426.2 L 709.0 419.0 L 706.3 413.6 L 730.2 402.4 L 723.1 390.1 L 725.6 385.4 Z M 696.0 301.8 L 702.8 296.4 L 708.9 305.0 L 721.7 301.2 L 728.6 305.4 L 759.9 280.5 L 757.9 276.8 L 766.5 278.1 L 768.7 270.2 L 796.0 265.7 L 799.0 257.9 L 766.8 250.8 L 744.0 262.3 L 737.7 255.7 L 743.4 250.3 L 737.2 246.0 L 720.7 243.4 L 713.3 250.5 L 703.0 250.6 L 679.5 270.1 L 679.2 283.3 L 691.6 278.3 L 670.8 295.2 L 682.7 302.9 L 696.0 301.8 Z M 636.7 338.2 L 653.2 337.3 L 655.1 346.4 L 671.0 352.5 L 688.1 347.4 L 688.5 334.8 L 677.0 334.4 L 672.2 325.9 L 678.7 325.5 L 683.6 311.5 L 694.2 316.3 L 700.4 313.6 L 699.4 307.7 L 670.8 295.2 L 691.6 278.3 L 679.6 283.6 L 681.3 277.4 L 653.1 274.3 L 651.4 285.9 L 643.3 290.7 L 626.0 291.6 L 618.1 298.5 L 598.7 302.4 L 612.9 329.8 L 636.7 338.2 Z M 609.5 325.2 L 583.4 325.5 L 595.1 331.6 L 584.4 339.1 L 585.8 348.2 L 595.8 357.3 L 582.1 368.0 L 567.0 367.9 L 566.1 378.3 L 578.6 389.0 L 589.0 379.6 L 601.7 380.3 L 600.6 374.9 L 606.4 373.7 L 629.8 383.5 L 639.7 379.1 L 643.6 384.5 L 650.5 378.2 L 655.8 391.2 L 682.0 378.3 L 692.2 378.6 L 687.8 357.5 L 676.4 350.2 L 657.3 347.9 L 653.2 337.3 L 630.4 338.7 L 609.5 325.2 Z M 625.4 459.6 L 628.1 452.6 L 639.2 457.1 L 638.9 450.1 L 656.6 448.5 L 661.4 437.1 L 656.9 437.1 L 659.3 430.5 L 650.7 414.9 L 661.6 402.6 L 660.0 394.4 L 652.6 390.5 L 650.5 378.2 L 642.5 384.7 L 641.7 379.4 L 629.8 383.5 L 621.1 377.0 L 600.6 374.9 L 601.7 380.3 L 583.4 383.2 L 579.5 397.5 L 583.8 414.6 L 572.9 422.3 L 584.0 421.5 L 580.7 434.3 L 587.4 441.5 L 592.1 436.4 L 596.7 440.2 L 602.5 434.2 L 613.3 435.2 L 611.9 440.3 L 616.7 441.8 L 608.3 455.9 L 613.3 453.1 L 616.1 460.8 L 625.4 459.6 Z M 650.3 500.0 L 652.3 491.8 L 665.7 496.3 L 669.0 490.8 L 671.9 494.7 L 698.2 488.5 L 709.3 478.4 L 703.2 461.0 L 688.2 456.5 L 687.4 462.5 L 680.4 458.8 L 664.5 463.7 L 660.2 460.4 L 669.4 453.6 L 666.3 448.9 L 644.9 447.4 L 638.9 450.1 L 639.2 457.1 L 628.1 452.6 L 614.6 489.2 L 588.4 509.5 L 591.1 531.5 L 601.3 528.5 L 595.5 521.0 L 599.4 516.2 L 640.1 505.9 L 642.7 501.3 L 645.6 505.4 L 650.3 500.0 Z M 584.2 439.1 L 570.2 450.6 L 565.7 446.9 L 556.2 453.5 L 547.2 445.8 L 528.0 461.3 L 514.8 455.6 L 503.6 462.9 L 515.6 470.5 L 528.4 470.0 L 529.9 478.3 L 520.7 486.3 L 541.2 490.5 L 536.7 496.1 L 539.0 504.0 L 550.2 509.8 L 589.1 512.0 L 614.6 489.2 L 626.0 465.3 L 625.4 459.6 L 615.8 460.5 L 614.9 453.5 L 608.3 455.9 L 616.7 441.8 L 611.9 440.3 L 613.3 435.2 L 584.2 439.1 Z M 594.3 534.8 L 581.2 536.5 L 570.6 545.6 L 570.6 559.4 L 585.8 564.8 L 600.7 556.7 L 609.5 539.0 L 603.7 532.6 L 594.3 534.8 Z M 655.8 732.9 L 666.3 727.5 L 655.8 732.9 Z M 533.7 399.3 L 535.3 394.4 L 539.1 400.5 L 556.0 388.5 L 565.1 390.5 L 569.5 402.2 L 577.7 404.7 L 581.5 391.0 L 566.1 378.3 L 567.0 367.9 L 593.9 363.0 L 594.5 353.3 L 566.6 340.8 L 569.0 349.2 L 557.7 363.1 L 551.7 362.4 L 544.8 375.1 L 524.2 369.0 L 516.3 383.2 L 533.7 399.3 Z M 449.2 420.4 L 456.7 436.0 L 464.4 438.5 L 478.9 433.6 L 477.0 418.8 L 493.2 402.6 L 492.7 397.0 L 502.1 397.7 L 500.1 406.8 L 504.5 410.2 L 512.4 406.1 L 516.4 412.4 L 532.6 410.7 L 521.8 402.5 L 527.1 395.5 L 533.8 400.0 L 516.8 384.7 L 523.4 377.5 L 520.1 373.3 L 524.8 368.8 L 544.8 375.1 L 551.7 362.4 L 557.7 363.1 L 569.0 349.2 L 564.3 344.4 L 568.3 339.9 L 519.0 329.0 L 505.6 333.3 L 499.9 330.5 L 498.0 318.4 L 481.6 315.1 L 477.5 307.0 L 464.9 312.5 L 470.4 319.3 L 465.9 324.4 L 459.8 326.0 L 460.1 318.3 L 456.7 326.3 L 448.5 324.4 L 449.0 333.3 L 440.7 335.5 L 428.2 327.2 L 425.6 332.2 L 418.3 329.9 L 404.2 310.6 L 392.3 310.0 L 387.6 314.9 L 393.7 321.4 L 387.1 329.6 L 401.3 338.4 L 412.1 353.8 L 407.5 356.8 L 413.3 363.6 L 416.6 400.9 L 420.1 404.8 L 425.6 394.2 L 435.3 412.1 L 441.3 408.9 L 449.2 420.4 Z M 580.8 399.8 L 572.6 404.3 L 565.1 390.5 L 551.0 388.5 L 539.1 400.5 L 535.3 394.4 L 533.8 400.0 L 527.1 395.5 L 521.5 399.4 L 531.6 411.4 L 517.1 411.7 L 509.3 419.0 L 494.0 416.5 L 488.7 422.6 L 491.3 430.2 L 502.0 428.2 L 506.3 433.5 L 500.2 445.2 L 508.6 451.7 L 503.7 459.8 L 514.8 455.6 L 528.0 461.3 L 547.2 445.8 L 557.5 453.7 L 581.8 443.8 L 584.8 422.7 L 572.9 422.3 L 583.8 414.6 L 580.8 399.8 Z M 516.4 412.4 L 512.4 406.1 L 503.4 409.6 L 502.1 397.7 L 492.7 397.0 L 493.2 402.6 L 477.0 418.8 L 478.5 434.1 L 460.0 438.8 L 425.6 394.2 L 418.9 404.0 L 413.7 388.4 L 413.5 394.4 L 407.9 392.4 L 409.3 404.0 L 400.0 405.4 L 402.9 415.3 L 409.2 414.8 L 409.2 441.9 L 393.2 454.2 L 390.1 472.6 L 412.0 469.0 L 412.2 484.1 L 423.1 488.6 L 416.5 500.8 L 429.8 502.5 L 434.0 511.8 L 448.4 507.0 L 450.0 515.6 L 458.9 516.9 L 457.4 495.8 L 467.1 496.6 L 471.0 491.0 L 479.4 496.3 L 484.2 490.5 L 494.6 495.3 L 529.9 478.3 L 527.6 469.5 L 504.5 464.7 L 508.6 451.7 L 500.2 445.2 L 506.0 432.6 L 502.0 428.2 L 492.2 431.1 L 488.7 422.6 L 494.0 416.5 L 514.3 417.7 L 516.4 412.4 Z M 263.2 278.6 L 226.1 273.3 L 173.0 290.3 L 145.6 284.6 L 132.9 292.3 L 112.5 288.9 L 102.3 304.3 L 83.8 310.6 L 94.3 334.4 L 88.8 338.6 L 85.1 332.6 L 79.9 334.8 L 80.0 340.8 L 89.4 359.1 L 100.1 360.1 L 123.9 375.5 L 128.5 369.1 L 139.7 370.2 L 163.9 388.9 L 172.3 387.1 L 178.3 395.9 L 188.7 396.9 L 188.5 402.2 L 198.4 401.7 L 202.9 409.1 L 206.0 405.0 L 222.8 410.6 L 245.9 405.9 L 251.4 420.3 L 264.4 403.8 L 291.6 407.6 L 293.6 415.0 L 301.4 417.4 L 302.1 425.9 L 329.8 423.2 L 337.3 414.3 L 362.5 403.0 L 382.5 411.8 L 390.7 399.0 L 407.9 405.0 L 407.9 392.4 L 413.5 394.4 L 415.8 388.2 L 415.1 376.9 L 407.5 356.8 L 412.1 353.8 L 401.3 338.4 L 387.3 334.9 L 386.5 342.6 L 377.0 343.7 L 377.9 349.0 L 368.3 345.4 L 367.8 350.2 L 357.3 347.8 L 352.6 337.5 L 342.8 333.1 L 324.9 336.3 L 274.4 323.8 L 261.9 311.2 L 265.7 299.0 L 258.9 292.5 L 264.6 282.5 L 258.2 279.8 L 263.2 278.6 Z M 598.7 302.4 L 602.5 285.9 L 598.8 263.8 L 605.5 255.2 L 600.8 245.1 L 612.8 227.4 L 611.0 222.9 L 604.0 227.9 L 595.0 225.0 L 577.2 241.3 L 572.7 253.2 L 555.0 250.0 L 548.9 254.4 L 548.9 265.5 L 570.7 273.9 L 570.1 290.8 L 556.0 291.1 L 557.9 296.0 L 552.4 297.5 L 536.4 294.7 L 532.7 302.7 L 539.3 306.1 L 534.3 313.4 L 537.0 318.7 L 527.2 318.1 L 522.9 321.8 L 526.3 328.0 L 519.4 329.9 L 544.9 332.6 L 585.8 348.2 L 586.6 334.3 L 595.9 333.8 L 584.7 324.1 L 609.2 322.7 L 598.7 302.4 Z M 535.8 284.3 L 533.5 292.2 L 525.9 289.4 L 517.6 283.4 L 514.1 264.2 L 485.5 250.4 L 485.7 241.7 L 498.3 232.4 L 496.6 225.5 L 461.1 230.5 L 463.9 234.0 L 459.1 237.7 L 445.9 233.1 L 443.9 225.8 L 421.1 218.1 L 433.0 211.9 L 432.0 202.3 L 403.3 207.2 L 391.7 193.3 L 395.2 189.9 L 384.3 171.7 L 366.9 174.8 L 366.2 185.4 L 341.5 192.3 L 328.9 205.7 L 315.4 207.2 L 305.8 228.5 L 338.8 236.0 L 341.9 242.6 L 369.6 245.9 L 382.4 238.7 L 380.9 229.1 L 399.2 235.6 L 411.0 230.9 L 432.3 244.5 L 431.2 239.9 L 462.7 252.6 L 473.1 262.5 L 470.0 264.6 L 480.0 276.6 L 478.0 282.8 L 461.3 298.0 L 466.9 306.3 L 461.9 310.2 L 442.6 309.1 L 449.1 317.4 L 460.8 318.7 L 460.5 326.3 L 470.2 320.8 L 464.9 312.5 L 477.5 307.0 L 481.6 315.1 L 498.0 318.4 L 499.9 330.5 L 505.6 333.3 L 525.4 328.9 L 526.0 319.1 L 537.0 318.7 L 534.3 313.4 L 539.3 306.1 L 532.7 302.7 L 536.4 294.7 L 552.4 297.5 L 557.9 296.0 L 556.0 291.1 L 570.1 290.8 L 570.1 273.2 L 546.8 261.9 L 537.4 262.1 L 533.6 271.3 L 543.2 278.6 L 542.2 283.9 L 535.8 284.3 Z M 476.1 274.3 L 472.4 261.3 L 462.7 252.6 L 431.2 239.9 L 432.3 244.5 L 411.0 230.9 L 399.2 235.6 L 380.9 229.1 L 382.4 238.7 L 369.6 245.9 L 341.9 242.6 L 338.8 236.0 L 319.5 233.5 L 318.4 229.4 L 270.0 240.3 L 288.6 261.5 L 279.3 269.6 L 286.1 278.2 L 267.9 275.6 L 258.2 279.8 L 264.6 282.5 L 258.9 292.5 L 265.7 299.0 L 261.9 311.2 L 273.7 323.5 L 324.9 336.3 L 342.8 333.1 L 352.6 337.5 L 357.3 347.8 L 368.6 350.3 L 368.3 345.4 L 377.9 349.0 L 377.0 343.7 L 393.4 335.5 L 387.1 329.6 L 393.7 321.4 L 387.5 314.5 L 394.7 308.7 L 404.2 310.6 L 418.3 329.9 L 425.6 332.2 L 428.2 327.2 L 433.6 334.2 L 449.0 333.3 L 448.5 324.4 L 456.7 326.3 L 459.1 319.4 L 449.1 317.4 L 443.5 306.9 L 458.4 310.7 L 466.9 306.3 L 461.3 298.0 L 475.8 287.1 L 480.0 276.6 L 476.1 274.3 Z M 548.2 262.6 L 554.6 250.7 L 535.4 243.1 L 543.1 233.2 L 539.8 226.2 L 527.1 233.7 L 523.7 251.4 L 499.8 257.3 L 514.1 264.2 L 517.6 283.4 L 533.5 292.2 L 534.7 285.1 L 542.7 283.1 L 533.5 270.9 L 537.4 262.1 L 548.2 262.6 Z M 371.5 172.8 L 355.7 147.7 L 324.8 137.1 L 282.2 133.5 L 278.8 127.3 L 285.0 109.2 L 274.1 94.4 L 234.9 79.5 L 232.5 70.0 L 217.3 70.7 L 212.3 80.1 L 196.2 85.7 L 195.5 103.7 L 185.9 106.9 L 154.6 101.2 L 142.3 126.7 L 147.1 133.3 L 134.5 130.4 L 103.7 138.0 L 112.0 142.5 L 118.6 165.6 L 111.6 168.0 L 115.3 170.1 L 109.8 171.2 L 107.8 183.8 L 69.5 200.0 L 54.9 199.9 L 46.0 210.8 L 35.8 211.8 L 34.1 205.8 L 21.8 208.0 L 0.0 226.1 L 4.8 238.4 L 22.1 240.5 L 26.6 258.5 L 16.2 263.0 L 38.5 269.5 L 43.2 282.9 L 75.3 288.1 L 76.5 300.5 L 87.6 306.3 L 102.3 304.3 L 112.5 288.9 L 132.9 292.3 L 145.6 284.6 L 173.0 290.3 L 225.0 273.4 L 281.7 279.8 L 286.1 278.2 L 279.7 266.9 L 288.6 261.5 L 269.7 240.6 L 307.1 232.1 L 315.4 207.2 L 328.9 205.7 L 341.5 192.3 L 366.2 185.4 L 364.9 177.4 L 371.5 172.8 Z M 762.1 496.3 L 768.8 505.2 L 778.1 485.2 L 787.6 455.5 L 781.3 450.8 L 771.5 454.9 L 756.6 476.2 L 755.2 486.2 L 762.1 496.3 Z M 795.8 480.0 L 800.2 462.1 L 795.8 480.0 Z M 773.9 522.4 L 785.9 508.1 L 773.9 522.4 Z M 746.4 567.0 L 755.3 550.6 L 746.4 567.0 Z M 733.6 675.7 L 738.4 662.8 L 733.6 675.7 Z M 682.6 740.2 L 694.0 726.7 L 682.6 740.2 Z M 589.8 611.3 L 581.1 595.7 L 589.8 611.3 Z';

const MIN_SCALE = 0.8;
const MAX_SCALE = 5;
const ZOOM_SENSITIVITY = 0.001;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * VIEW_WIDTH;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * VIEW_HEIGHT;
  return [x, y];
}

export function TravelMap() {
  const { t } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const [data, setData] = useState<CityData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    fetch('/data/cities.json')
      .then((res) => res.json())
      .then((json: CityData) => setData(json))
      .catch((error) => {
        console.error('Failed to load city data:', error);
      });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => {
      const next = prev + e.deltaY * -ZOOM_SENSITIVITY;
      return Math.min(Math.max(next, MIN_SCALE), MAX_SCALE);
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
  }, [translate]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setTranslate({
        x: translateStart.current.x + dx,
        y: translateStart.current.y + dy,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  if (!data) return null;

  const allMarkers = Array.from(
    new Map(
      [...data.visited, data.current].map((city) => [city.name, city])
    ).values()
  );

  return (
    <>
      {/* Preview card */}
      <motion.div
        initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="col-span-1 sm:col-span-2 lg:col-span-3 p-5 border-2 cursor-pointer group"
        onClick={() => setIsOpen(true)}
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '4px 4px 0 var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
          <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {t.home.travelMap}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div
            className="w-full sm:w-48 h-28 border-2 overflow-hidden shrink-0"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-tertiary)' }}
          >
            <svg
              viewBox="0 0 1000 800"
              className="w-full h-full transition-transform duration-300 group-hover:scale-105"
              preserveAspectRatio="xMidYMid meet"
            >
              <path
                d={CHINA_PATH_D}
                fill="var(--accent-primary)"
                fillOpacity={0.15}
                stroke="var(--accent-primary)"
                strokeWidth={2}
              />
              {allMarkers.map((city) => {
                const [cx, cy] = project(city.coordinates[0], city.coordinates[1]);
                const isCurrent = city.name === data.current.name;
                return (
                  <circle
                    key={city.name}
                    cx={cx}
                    cy={cy}
                    r={isCurrent ? 5 : 3}
                    fill={isCurrent ? 'var(--accent-secondary)' : 'var(--accent-primary)'}
                  />
                );
              })}
            </svg>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {t.home.travelMapVisited.replace('{count}', String(data.visited.length))}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t.home.travelMapCurrent.replace('{city}', data.current.name)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.75)' }}
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl h-[70vh] sm:h-[80vh] border-2 flex flex-col"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)',
                boxShadow: '8px 8px 0 var(--border-subtle)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                  <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {t.home.travelMap}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                  aria-label={t.common.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Map viewport */}
              <div
                className="relative flex-1 overflow-hidden cursor-move"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <svg
                  viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                  className="w-full h-full"
                  style={{
                    transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                    transformOrigin: 'center center',
                  }}
                >
                  <path
                    d={CHINA_PATH_D}
                    fill="var(--accent-primary)"
                    fillOpacity={0.12}
                    stroke="var(--accent-primary)"
                    strokeWidth={1.5}
                  />

                  {allMarkers.map((city) => {
                    const [cx, cy] = project(city.coordinates[0], city.coordinates[1]);
                    const isCurrent = city.name === data.current.name;

                    return (
                      <g key={city.name}>
                        {isCurrent && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={18 / scale}
                            fill="var(--accent-secondary)"
                            fillOpacity={0.25}
                          >
                            <animate
                              attributeName="r"
                              values={`${10 / scale};${22 / scale};${10 / scale}`}
                              dur="2s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="fill-opacity"
                              values="0.4;0.1;0.4"
                              dur="2s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isCurrent ? 5.5 : 4}
                          fill={isCurrent ? 'var(--accent-secondary)' : 'var(--accent-primary)'}
                          stroke="var(--bg-primary)"
                          strokeWidth={1.5}
                        />
                        <text
                          x={cx}
                          y={cy - 10 / scale}
                          textAnchor="middle"
                          fontSize={12 / scale}
                          fontWeight="bold"
                          fill="var(--text-primary)"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {city.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div
                  className="absolute bottom-4 left-4 px-3 py-2 border-2 text-[10px] font-mono uppercase"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-secondary)' }} />
                    {t.home.travelMapCurrent.replace('{city}', data.current.name)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-primary)' }} />
                    {t.home.travelMapVisitedLabel}
                  </div>
                </div>

                {/* Hint */}
                <div
                  className="absolute bottom-4 right-4 px-3 py-2 border-2 text-[10px] font-mono uppercase"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {t.home.travelMapHint}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
