import axios from 'axios';

async function test() {
  try {
    const urls = [
        "https://data.ntpc.gov.tw/api/datasets/35D3CF5B-A06D-4BCB-81AF-74DCB0ECE8BA/json?size=2"
    ];
    // What if we use http ?
    const r = await axios.get("http://data.ntpc.gov.tw/api/datasets/35D3CF5B-A06D-4BCB-81AF-74DCB0ECE8BA/json?size=2", {timeout: 3000});
    console.log("Data length:", JSON.stringify(r.data).length);
  } catch (e) {
    console.error(e.message);
  }
}
test();
