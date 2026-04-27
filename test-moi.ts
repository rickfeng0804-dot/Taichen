import axios from 'axios';
import { parse } from 'csv-parse/sync';

async function testMoi() {
  try {
    const url = 'https://plvr.land.moi.gov.tw/DownloadOpenData?fileName=F_lvr_land_A.csv';
    console.log("Fetching from:", url);
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
    const decoder = new TextDecoder('big5'); // MOI csv is often big5 or utf8. Let's try utf-8 first.
    let text = new TextDecoder('utf-8').decode(response.data);
    
    // Check if it's garbled
    if (text.includes('\ufffd')) {
      console.log('UTF-8 failed, trying Big5? wait, open data might be utf8 now.');
    }
    
    console.log("Text preview:", text.substring(0, 500));
    
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });
    
    console.log("Total records fetched:", records.length);
    console.log("First record:", records[1]); // records[0] is often English headers in MOI data
    
  } catch (e) {
    console.error("Fetch failed:", e.message);
  }
}

testMoi();
