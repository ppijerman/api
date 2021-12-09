const axios = require('axios').default;

exports.handler = async (event, context) => {
    const response = {
        headers: {
            'Access-Control-Allow-Origin': `${process.env.ALLOWED_SITE || 'https://ppijerman.org'}`,
            'Access-Control-Allow-Methods': 'GET',
            'Content-Type': 'application/json'
        }
    }

    const data = await axios.get(`https://graph.instagram.com/me/media?access_token=${process.env.ACCESS_TOKEN}&limit=${process.env.LIMIT || 9}&fields=media_type,media_url,timestamp,thumbnail_url`,
        {
            method: `get`,
            responseType: `json`
        }).then(response => response.data.data)
        .catch(error => console.error(error));

    if (data !== null) {
        response.statusCode = 200;
        response.body = JSON.stringify({
            data: data
        });
    } else {
        response.statusCode = 500;
        response.body = 'Something bad happens';
    }

    return response;
}