import axios from 'axios';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import path from 'path';

async function updateData() {
  try {
    const seasons = ['113S1', '113S2', '113S3', '113S4']; // 2024 data
    const allData = [];

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'src/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    for (const season of seasons) {
      console.log(`Downloading MOI real estate data for season ${season}...`);
      const url = `https://plvr.land.moi.gov.tw/DownloadSeason?season=${season}&type=zip&fileName=lvr_landcsv.zip`;
      
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
        const zip = new AdmZip(Buffer.from(response.data));
        
        // Find 'f_lvr_land_a.csv' (New Taipei City Buy/Sell)
        const zipEntry = zip.getEntry('f_lvr_land_a.csv') || zip.getEntry('F_lvr_land_A.csv');
        if (!zipEntry) {
          console.warn(`Could not find New Taipei City data in ${season}`);
          continue;
        }

        const csvData = zipEntry.getData();
        // MOI CSV is strictly UTF-8 these days, but let's carefully decode it
        // Check for CSV header row
        const text = csvData.toString('utf8');
        
        const records = parse(text, {
          columns: true,
          skip_empty_lines: true,
          relax_column_count: true,
          bom: true
        });

        // The first row in MOI CSV is an english mapping (e.g. "The villages and towns urban district", "transaction sign", etc)
        // We will skip it using the fact it contains english.
        
        for (let i = 1; i < records.length; i++) {
          const r = records[i];
          // Filter for all of New Taipei City
          if (r['鄉鎮市區']) { // Keep all records from the New Taipei file
            allData.push({
              "鄉鎮市區": r['鄉鎮市區'],
              "交易標的": r['交易標的'],
              "土地區段位置建物區段門牌": r['土地位置建物門牌'],
              "建物型態": r['建物型態'],
              "交易年月日": r['交易年月日'],
              "總價元": r['總價元'],
              "單價元平方公尺": r['單價元平方公尺'],
              "建物移轉總面積平方公尺": r['建物移轉總面積平方公尺'],
              "主要用途": r['主要用途']
            });
          }
        }
        console.log(`Extracted ${allData.length} total NTPC records after ${season}`);
      } catch (err) {
        console.error(`Error downloading/processing ${season}:`, err.message);
      }
    }

    if (allData.length > 0) {
      // Sort by transaction date descending
      allData.sort((a, b) => parseInt(b['交易年月日'] || '0') - parseInt(a['交易年月日'] || '0'));
      fs.writeFileSync(path.join(dataDir, 'ntpc-real-estate.json'), JSON.stringify(allData, null, 2));
      console.log(`Success! Saved ${allData.length} records to src/data/ntpc-real-estate.json`);
    } else {
      console.error("No NTPC data found in the provided seasons.");
    }

  } catch (e) {
    console.error("Fatal error:", e);
  }
}

updateData();
