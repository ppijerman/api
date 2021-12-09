const axios = require('axios').default;

exports.handler = async (event, context) => {
    const data = await axios.get(`https://graph.instagram.com/me/media?access_token=${process.env.ACCESS_TOKEN}&limit=${process.env.LIMIT ? process.env.LIMIT : 9}&fields=media_type,media_url,timestamp,thumbnail_url`,
        {
            method: `get`,
            responseType: "json"
        }).then(response => response.data)
        .catch(error => console.error(error));

    if (data !== null) {
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        }
    } else {
        return {
            statusCode: 500,
            body: "Something bad happens"
        }
    }
}