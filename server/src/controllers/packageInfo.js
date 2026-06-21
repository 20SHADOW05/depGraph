import axios from "axios";

export const packageScores = async (packages) => {
    const res = axios.post('https://api.npms.io/v2/package/mget', packages, {
        Headers: {
            Accept: 'application/json',
	        'Content-Type': 'application/json'
        }
    })
    return res.data;
}

export const packageVuln = async (packages) => {
    const res = await axios.post('https://api.osv.dev/v1/querybatch', packages, {
        Headers: {
            Accept: 'application/json',
	        'Content-Type': 'application/json'
        }
    })
    return res.json
}