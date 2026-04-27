export interface RealEstateRecord {
  "鄉鎮市區": string;
  "交易標的": string;
  "土地區段位置建物區段門牌": string;
  "建物型態": string;
  "交易年月日": string;
  "總價元": string;
  "單價元平方公尺": string;
  "建物移轉總面積平方公尺": string;
  "主要用途": string;
}

export interface ApiResponse {
  status: string;
  source: string;
  data: RealEstateRecord[];
}
